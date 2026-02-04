from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import uvicorn
from fastapi import FastAPI, UploadFile, File
import storage
import service
import get_curr
from jose import jwt, JOSEError, JWTError
from pydantic import BaseModel
from fastapi import HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
from tenacity import retry, stop_after_attempt, wait_exponential
import os

app = FastAPI()


origins = [
    os.getenv('SERVER1'),
    os.getenv('SERVER2'),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)

@app.get("/api/message")
async def read_root():
    return {"message": "Welcome to the FastAPI App!"}




@app.post("/api/upload")
async def get_files(file_uploads: list[UploadFile],user: get_curr.User = Depends(get_curr.get_current_user)):
    
    for file in file_uploads:
        ext = file.filename.split(".")[-1]
        data = await file.read()
        storage.save_photos(data,user.sub,ext)
    
    return None




@app.get("/api/photos")
async def get_data(user: get_curr.User = Depends(get_curr.get_current_user)):

    vector = service.select_photos(user.sub)

    return vector




@app.delete("/api/photos")
async def delete_all(user: get_curr.User = Depends(get_curr.get_current_user)):

    result = service.delete_all_photos(user.sub)
    
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result["message"])
    
    return result




@app.delete("/api/photos/{photo_id}")
async def delete_photo(photo_id: str, user: get_curr.User = Depends(get_curr.get_current_user)):
    
    result = service.delete_single(user.sub, photo_id)
    
    if not result["success"]:
        raise HTTPException(status_code=404, detail=result["message"])
    
    return result




if __name__ == "__main__":
   
    uvicorn.run(app, host="0.0.0.0", port=8000)