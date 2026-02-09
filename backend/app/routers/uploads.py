from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
import os
import uuid
from typing import List

router = APIRouter(
    prefix="/uploads",
    tags=["uploads"],
)

UPLOAD_DIR = "uploads"

# Ensure upload directory exists
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.post("/", response_model=dict)
async def upload_file(file: UploadFile = File(...)):
    try:
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Return the URL (assuming local development for now, would need full URL in prod)
        # We will mount /static to UPLOAD_DIR
        return {"url": f"http://localhost:8000/static/{unique_filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
