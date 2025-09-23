from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import os
import tempfile
import shutil
from pathlib import Path

try:
    from services.certificateValidatorService import is_valid_certificate
    CERTIFICATE_VALIDATOR_AVAILABLE = True
except ImportError:
    CERTIFICATE_VALIDATOR_AVAILABLE = False

router = APIRouter()

@router.post("/verify-education")
async def education_verification(file: UploadFile = File(...)):
    """
    Validate an education certificate by uploading an image file.
    Returns validation verdict and extracted data if valid.
    """
    if not CERTIFICATE_VALIDATOR_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="Not Valid!"
        )

    # Validate file type
    allowed_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif'}
    file_extension = Path(file.filename).suffix.lower()

    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only image files (jpg, jpeg, png, bmp, tiff, tif) are allowed."
        )

    # Validate file size (max 10MB)
    max_file_size = 10 * 1024 * 1024  # 10MB
    file_content = await file.read()
    if len(file_content) > max_file_size:
        raise HTTPException(
            status_code=400,
            detail="File too large. Maximum file size is 10MB."
        )

    # Create temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
        temp_file.write(file_content)
        temp_file_path = temp_file.name

    try:
        # Validate the certificate using the service
        is_valid, info = is_valid_certificate(temp_file_path)

        if is_valid:
            # Certificate is valid, return extracted fields
            return JSONResponse(
                status_code=200,
                content={
                    "verdict": "VALID",
                    "data": info
                }
            )
        else:
            # Certificate is invalid, return error details
            return JSONResponse(
                status_code=200,
                content={
                    "verdict": "NOT VALID",
                    "error": info
                }
            )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Validation process failed: {str(e)}"
        )

    finally:
        # Clean up temporary file
        try:
            os.unlink(temp_file_path)
        except OSError:
            pass  # File may already be deleted or inaccessible
