from fastapi import APIRouter, HTTPException, Response, Request, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from models.user import User
from models.database_models import User as UserModel
from config.database import get_db
import jwt
import os
from datetime import datetime, timezone

authRouter = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")  # Set this in your environment

@authRouter.post("/")
async def login(
    request: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    try:
        if not request.email or not request.password:
            raise HTTPException(status_code=400, detail="Email and password are required")

        result = await db.execute(
            select(UserModel).where(UserModel.email == request.email)
        )
        user_obj = result.scalar_one_or_none()

        if not user_obj:
            raise HTTPException(status_code=401, detail="Email not found")

        if not user_obj.verify_password(request.password):
            raise HTTPException(status_code=401, detail="Invalid credentials password")

        # Generate JWT token
        token = jwt.encode(
            {
                "id": user_obj.uuid,
                "email": user_obj.email,
                "exp": datetime.now(timezone.utc).timestamp() + 60 * 60 * 24 * 7,
            },
            JWT_SECRET,
            algorithm="HS256"
        )

        # Set HTTP-only cookie
        response.set_cookie(
            key="auth_token",
            value=token,
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite="strict",
            max_age=60*60*24*31,  # 31 days
            path="/"
        )

        user_data = user_obj.to_dict()
        user_data.pop("password", None)

        return {
            "success": True,
            "user": user_data,
        }
    except Exception as ex:
        print(f"Login error: {ex}")
        raise HTTPException(status_code=500, detail="Internal server error")

@authRouter.get("/")
async def get_current_user(request: Request, db: AsyncSession = Depends(get_db)):
    try:
        # Get token from cookie
        token = request.cookies.get("auth_token")

        if not token:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Verify JWT token
        try:
            decoded = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")

        # Find user by ID
        result = await db.execute(
            select(UserModel).where(UserModel.uuid == decoded["id"])
        )
        user_obj = result.scalar_one_or_none()

        if not user_obj:
            raise HTTPException(status_code=404, detail="User not found")

        user_data = user_obj.to_dict()
        user_data.pop("password", None)

        return {"user": user_data}

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

@authRouter.delete("/")
async def logout(response: Response):
    try:
        # Clear the authentication cookie
        response.delete_cookie(
            key="auth_token",
            path="/",
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite="strict"
        )

        return {
            "success": True,
            "message": "Logged out successfully"
        }

    except Exception as e:
        print(f"Logout error: {e}")
        raise HTTPException(status_code=500, detail="Logout failed")

@authRouter.post("/logout")
async def logout_post(response: Response):
    try:
        # Clear the authentication cookie
        response.delete_cookie(
            key="auth_token",
            path="/",
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite="strict"
        )

        return {
            "success": True,
            "message": "Logged out successfully"
        }

    except Exception as e:
        print(f"Logout error: {e}")
        raise HTTPException(status_code=500, detail="Logout failed")

@authRouter.post("/register")
async def register(request: dict, response: Response, db: AsyncSession = Depends(get_db)):
    try:
        # Basic validation
        username = request.get("username") or request.get("email")
        email = request.get("email")
        password = request.get("password")

        if not email or not password:
            raise HTTPException(status_code=400, detail="Email and password are required")

        existing_email = await db.execute(
            select(UserModel).where(UserModel.email == email)
        )
        if existing_email.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email already exists")

        if username:
            existing_username = await db.execute(
                select(UserModel).where(UserModel.username == username)
            )
            if existing_username.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="Username already exists")

        new_user = UserModel(
            username=username,
            email=email,
            password=User.hash_password(password),
            role="admin",
            permissions=[],
            is_active=True,
        )

        db.add(new_user)
        try:
            await db.commit()
        except IntegrityError:
            await db.rollback()
            raise HTTPException(status_code=400, detail="User already exists")

        await db.refresh(new_user)

        token = jwt.encode(
            {
                "id": new_user.uuid,
                "email": new_user.email,
                "exp": datetime.now(timezone.utc).timestamp() + 60 * 60 * 24 * 7,
            },
            JWT_SECRET,
            algorithm="HS256",
        )

        response.set_cookie(
            key="auth_token",
            value=token,
            httponly=True,
            secure=False,
            samesite="strict",
            max_age=60 * 60 * 24 * 7,
            path="/",
        )

        user_data = new_user.to_dict()
        user_data.pop("password", None)

        return {
            "success": True,
            "user": user_data,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Register error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

