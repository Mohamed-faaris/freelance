
from math import e
from fastapi import APIRouter, HTTPException, Response, Request
from pydantic import BaseModel
from models.user import User
from config.db import userCollection
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
        user_doc = userCollection.find_one({"email": request.email})
        if not user_doc:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Create User instance from document
        user = User(**user_doc)

        # Check password
        if not user.verify_password(request.password):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Generate JWT token
        token = jwt.encode(
            {"id": str(user_doc["_id"]), "email": user.email, "exp": datetime.now(timezone.utc).timestamp() + 60*60*24*7},
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
            max_age=60*60*24*7,  # 7 days
            path="/"
        )

        return {
            "success": True,
            "user": {
                "id": str(user_doc["_id"]),
                "_id": str(user_doc["_id"]),
                "email": user.email,
                "username": user.username,
                "role": user.role,
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
        from bson import ObjectId
        user_doc = userCollection.find_one({"_id": ObjectId(decoded["id"])})

        if not user_doc:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "user": {
                "_id": str(user_doc["_id"]),
                "id": str(user_doc["_id"]),
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
def register():
    pass
