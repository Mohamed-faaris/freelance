from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import jwt
import os
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import asyncio
from typing import List, Optional, Dict, Any

courtCasesRouter = APIRouter()

JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")

# Configuration
STORAGE_DIR = Path("data") / "court-cases"
CACHE_DURATION = 24 * 60 * 60 * 1000  # 24 hours in milliseconds

class FileStorageService:
    @staticmethod
    def ensure_storage_directory():
        STORAGE_DIR.mkdir(parents=True, exist_ok=True)

    @staticmethod
    def list_all_case_files() -> List[str]:
        FileStorageService.ensure_storage_directory()
        return [f for f in os.listdir(STORAGE_DIR) if f.endswith('.json')]

    @staticmethod
    def load_case_data(file_name: str) -> Optional[Dict[str, Any]]:
        try:
            file_path = STORAGE_DIR / file_name
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            # Check if data is still fresh
            is_data_fresh = datetime.now().timestamp() * 1000 - data.get('timestamp', 0) < CACHE_DURATION
            if not is_data_fresh:
                return None

            return data
        except (FileNotFoundError, json.JSONDecodeError):
            return None

    @staticmethod
    def delete_old_files(days_old: int = 30) -> int:
        FileStorageService.ensure_storage_directory()
        cutoff_time = datetime.now().timestamp() - (days_old * 24 * 60 * 60)

        deleted_count = 0
        for file_name in os.listdir(STORAGE_DIR):
            if not file_name.endswith('.json'):
                continue

            file_path = STORAGE_DIR / file_name
            if file_path.stat().st_mtime < cutoff_time:
                file_path.unlink()
                deleted_count += 1

        return deleted_count

def authenticate_user(request: Request):
    token = request.cookies.get("auth_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        decoded = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return decoded
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@courtCasesRouter.get("/")
async def get_court_cases(request: Request, action: Optional[str] = None, fileName: Optional[str] = None):
    # Authenticate user
    authenticate_user(request)

    if action == "files":
        files = FileStorageService.list_all_case_files()
        return {"files": files, "count": len(files)}

    elif action == "load" and fileName:
        data = FileStorageService.load_case_data(fileName)
        if not data:
            raise HTTPException(status_code=404, detail="File not found or expired")
        return data

    elif action == "cleanup":
        deleted_count = FileStorageService.delete_old_files(30)
        return {"message": f"Cleaned up {deleted_count} old files", "deletedCount": deleted_count}

    else:
        raise HTTPException(status_code=400, detail="Invalid action or missing parameters")
