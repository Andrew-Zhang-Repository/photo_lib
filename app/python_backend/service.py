
import boto3
from dotenv import load_dotenv
import os
from boto3.dynamodb.conditions import Key

TTL = 300

load_dotenv(".env")
BUCKET_NAME = os.getenv('BUCKET_NAME')
dynamodb = boto3.resource('dynamodb', region_name=os.getenv('AWS_REGION'))
table = dynamodb.Table(os.getenv('DYNAMO_NAME'))
s3_client = boto3.client('s3',region_name=os.getenv('AWS_REGION'))



def select_photos(user_id):
   

    response = table.query(KeyConditionExpression=Key('PK').eq("USER#"+user_id))
  
    items = response.get('Items', [])
    
    photo_data = []
    for item in items:
        
        thumbnail_url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': os.getenv('BUCKET_NAME'), 'Key': item['s3_thumbnail']},
            ExpiresIn=TTL
        )

        photo_url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': os.getenv('BUCKET_NAME'), 'Key': item['s3_photo']},
            ExpiresIn=TTL
        )
    
        photo_data.append({
                'photo_id': item['photo_id'],
                'created_at': item['created_at'],
                'status': item['status'],
                'content_type': item['content_type'],
                'thumbnail_url': thumbnail_url,
                'photo_url': photo_url,
                'labels': item.get('labels', []), 
            })
        
    return photo_data

def get_photo_metadata(user_id: str, photo_id: str):
    
    try:
        response = table.get_item(
            Key={
                'PK': f'USER#{user_id}',
                'SK': f'PHOTO#{photo_id}'
            }
        )
        return response.get('Item')
    except Exception as e:
        print(f"Error fetching photo metadata: {e}")
        return None


def delete_single(user_id: str, photo_id: str) -> dict:
    """
    Delete a single photo:
    1. Get photo metadata from DynamoDB (to find S3 keys)
    2. Delete photo from S3
    3. Delete thumbnail from S3
    4. Delete DynamoDB record
    
    Returns: {"success": bool, "message": str}
    """

    item = get_photo_metadata(user_id, photo_id)
    
    if not item:
        return {"success": False, "message": "Photo not found"}
    
    try:
        s3_client.delete_object(
            Bucket=BUCKET_NAME,
            Key=item['s3_photo']
        )
        
  
        s3_client.delete_object(
            Bucket=BUCKET_NAME,
            Key=item['s3_thumbnail']
        )
        
      
        table.delete_item(
            Key={
                'PK': f'USER#{user_id}',
                'SK': f'PHOTO#{photo_id}'
            }
        )
        
        return {"success": True, "message": "Photo deleted successfully"}
        
    except Exception as e:
        print(f"Error deleting photo: {e}")
        return {"success": False, "message": f"Error deleting photo: {str(e)}"}


def delete_all_photos(user_id: str) -> dict:
    
    deleted_count = 0
    
    try:
        # Step 1: List all S3 objects for this user
        s3_objects_to_delete = []
        
        paginator = s3_client.get_paginator('list_objects_v2')
        pages = paginator.paginate(
            Bucket=BUCKET_NAME,
            Prefix=f"{user_id}/"
        )
        
        for page in pages:
            if 'Contents' in page:
                for obj in page['Contents']:
                    s3_objects_to_delete.append({'Key': obj['Key']})

        if s3_objects_to_delete:
      
            for i in range(0, len(s3_objects_to_delete), 1000):
                chunk = s3_objects_to_delete[i:i + 1000]
                s3_client.delete_objects(
                    Bucket=BUCKET_NAME,
                    Delete={'Objects': chunk}
                )
        
     
        response = table.query(
            KeyConditionExpression=Key('PK').eq(f'USER#{user_id}')
        )
        items = response.get('Items', [])
        
     
        with table.batch_writer() as batch:
            for item in items:
                batch.delete_item(
                    Key={
                        'PK': item['PK'],
                        'SK': item['SK']
                    }
                )
                deleted_count += 1
        
        return {
            "success": True,
            "message": f"Deleted {deleted_count} photos",
            "deleted_count": deleted_count
        }
        
    except Exception as e:
        print(f"Error deleting all photos: {e}")
        return {
            "success": False,
            "message": f"Error deleting photos: {str(e)}",
            "deleted_count": deleted_count
        }