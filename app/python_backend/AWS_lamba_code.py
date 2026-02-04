import json
import boto3
import io
import os
import urllib.parse
from datetime import datetime
from decimal import Decimal
from PIL import Image


s3 = boto3.client('s3', region_name='ap-southeast-2')
rekognition = boto3.client('rekognition', region_name='ap-southeast-2')
dynamodb = boto3.resource('dynamodb', region_name='ap-southeast-2')
table = dynamodb.Table('photo_db')

def lambda_handler(event, context):
    try:
       
        bucket = event['Records'][0]['s3']['bucket']['name']
        raw_key = event['Records'][0]['s3']['object']['key']
        key = urllib.parse.unquote_plus(raw_key, encoding='utf-8')

      
        if '/thumbnails/' in key:
            print("Skipping thumbnail processing.")
            return {'statusCode': 200, 'body': 'Skipping thumbnail'}


        str_list = key.split("/")
        if len(str_list) < 3:
            raise ValueError(f"Key structure is incorrect. Expected 3 parts, got: {key}")
            
        user_id = str_list[0]
        photo_id = str_list[2].split(".")[0]

        print(f"Running Rekognition for: {key}")
        rek_response = rekognition.detect_labels(
            Image={'S3Object': {'Bucket': bucket, 'Name': key}},
            MaxLabels=10,
            MinConfidence=70
        )
        
        labels = [l['Name'] for l in rek_response['Labels']]
        label_confidence = {
            l['Name']: Decimal(str(round(l['Confidence'], 2))) 
            for l in rek_response['Labels']
        }

        print(f"Generating thumbnail for: {key}")
        resp = s3.get_object(Bucket=bucket, Key=key)
        image = Image.open(io.BytesIO(resp['Body'].read()))
        image.thumbnail((300, 300))
        
        buffer = io.BytesIO()
        image.save(buffer, format='PNG')
        buffer.seek(0)
        
        thumbnail_key = key.replace('/photos/', '/thumbnails/')
        s3.put_object(
            Bucket=bucket,
            Key=thumbnail_key,
            Body=buffer,
        )

        print(f"Saving metadata to DynamoDB for: {photo_id}")
        dic = {
            "PK": f"USER#{user_id}",
            "SK": f"PHOTO#{photo_id}",
            "labels": labels,
            "confidence": label_confidence,
            "photo_id": photo_id,
            "s3_photo": key,
            "s3_thumbnail": thumbnail_key,
            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "status": "PROCESSED",
            "content_type": "image/png",
        }
        table.put_item(Item=dic)

        return {
            'statusCode': 200,
            'body': json.dumps({'photo_id': photo_id, 'labels': labels})
        }

    except Exception as e:
        print(f"ERROR: {str(e)}")
        raise e