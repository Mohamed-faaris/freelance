
from math import e
from fastapi import APIRouter, HTTPException, Response, Request
from pydantic import BaseModel
from utils.dbCalls.auth_db import (
    authenticate_user_by_email,
    get_user_for_token_validation,
    check_user_exists_by_email,
    check_user_exists_by_username,
    insert_new_user
)
from utils.dbCalls.user_db import validate_user_password, create_user
from schemas.user import serializeDict
import jwt
import os
from datetime import datetime, timezone

authRouter = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")  # Set this in your environment

@authRouter.post("/")
async def login(request: LoginRequest, response: Response):
    try:
        if not request.email or not request.password:
            raise HTTPException(status_code=400, detail="Email and password are required")

        # Find user
        user_doc = await authenticate_user_by_email(request.email)
        if not user_doc:
            raise HTTPException(status_code=401, detail="email not found")

        # Check password using database function
        if not await validate_user_password(user_doc, request.password):
            raise HTTPException(status_code=401, detail="Invalid credentials password")

        # Generate JWT token
        token = jwt.encode(
            {"id": str(user_doc["id"]), "email": user_doc["email"], "exp": datetime.now(timezone.utc).timestamp() + 60*60*24*7},
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

        return {
            "success": True,
            "user": {
                "id": str(user_doc["id"]),
                "email": user_doc["email"],
                "username": user_doc["username"],
                "role": user_doc["role"],
            },
        }
    except Exception as ex:
        print(f"Login error: {ex}")
        raise HTTPException(status_code=500, detail="Internal server error")

@authRouter.get("/")
async def get_current_user(request: Request):
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
        user_doc = await get_user_for_token_validation(int(decoded["id"]))

        if not user_doc:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "user": {
                "_id": str(user_doc["id"]),  # Keep for backwards compatibility
                "id": str(user_doc["id"]),
                "username": user_doc["username"],
                "email": user_doc["email"],
                "role": user_doc["role"],
            },
        }

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
async def register(request: dict, response: Response):
    try:
        # Basic validation
        username = request.get("username") or request.get("email")
        email = request.get("email")
        password = request.get("password")

        if not email or not password:
            raise HTTPException(status_code=400, detail="Email and password are required")

        # Check if email or username already exists
        if await check_user_exists_by_email(email):
            raise HTTPException(status_code=400, detail="Email already exists")
        if username and await check_user_exists_by_username(username):
            raise HTTPException(status_code=400, detail="Username already exists")

        # Create user using database function (handles password hashing)
        user_doc = {
            "username": username,
            "email": email,
            "password": password,  # Will be hashed by create_user function
            "role": "admin",
            "permissions": [],
        }

        # Create user (this function handles hashing and timestamps)
        created_user = await create_user(user_doc)
        user_id = str(created_user["id"])

        # Prepare response (do not include password)

        token = jwt.encode(
            {"id": user_id, "email": email, "exp": datetime.now(timezone.utc).timestamp() + 60*60*24*7},
            JWT_SECRET,
            algorithm="HS256"
        )

        # Set HTTP-only cookie like login
        response.set_cookie(
            key="auth_token",
            value=token,
            httponly=True,
            secure=False,  # Set True in production
            samesite="strict",
            max_age=60*60*24*7,
            path="/"
        )

        return {
            "success": True,
            "user": {
                "id": user_id,
                "username": username,
                "email": email,
                "role": "admin",
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Register error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

