from pathlib import Path
from fastapi import UploadFile
import os
from datetime import datetime,timezone
import boto3
import uuid
from dotenv import load_dotenv


load_dotenv(".env")


BUCKET_NAME = os.getenv("BUCKET_NAME")
s3 = boto3.client('s3',region_name = os.getenv("AWS_REGION"))

def save_photos(data,user_id,ext):

  
    new_uuid = uuid.uuid4()
    photoId = str(new_uuid)
    
    
    
    s3.put_object(
        Body=data,
        Bucket=BUCKET_NAME,
        Key= f"{user_id}/photos/{photoId}.{ext}",
    )

    


    return None