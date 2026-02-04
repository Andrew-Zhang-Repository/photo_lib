
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

def delete_all_photos(id):

    obj_photos = s3_client.delete_object(
        Bucket=BUCKET_NAME,
        Key=f"{id}/photos/"
    )

    obj_thumbnails = s3_client.delete_object(
        Bucket=BUCKET_NAME,
        Key=f"{id}/thumbnails/"
    )
  

    response = table.query(
        KeyConditionExpression=Key('PK').eq(f'USER#{id}')
    )
    items = response.get('Items', [])
    
    deleted_count = 0
  
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



def delete_single(user_id, photo_id):

    response = table.get_item(
        Key={
            'PK': f'USER#{user_id}',
            'SK': f'PHOTO#{photo_id}'
        }
    )

    item = response.get('Item')

    if not item:
        return {"success": False, "message": "Photo not found"}
    

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





