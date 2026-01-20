from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
import os
from datetime import datetime
from pathlib import Path

router = APIRouter(prefix="/upload", tags=["Upload"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Create unique filename
        timestamp = int(datetime.utcnow().timestamp())
        filename = f"{timestamp}_{file.filename.replace(' ', '_')}"
        file_path = UPLOAD_DIR / filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Generate URL (assuming local server for now)
        # In production, this would be an S3 URL or similar
        # We will mount /uploads in server.py to serve these files
        url = f"/uploads/{filename}"
        
        return {
            "url": url,
            "filename": file.filename,
            "saved_name": filename,
            "content_type": file.content_type,
            "size": os.path.getsize(file_path)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
