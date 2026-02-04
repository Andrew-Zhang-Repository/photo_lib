import requests
from jose import jwt, JOSEError, JWTError
from pydantic import BaseModel
from fastapi import HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
from tenacity import retry, stop_after_attempt, wait_exponential
from dotenv import load_dotenv
import os

load_dotenv(".env")



AWS_REGION = os.getenv('AWS_REGION')
COGNITO_USER_POOL_ID = os.getenv('COGNITO_USER_POOL_ID')
COGNITO_CLIENT_ID = os.getenv('COGNITO_CLIENT_ID')


JWKS_URL = f"https://cognito-idp.{AWS_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}/.well-known/jwks.json"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


class User(BaseModel):
    username: str
    email: str
    sub: str



def get_jwks():
    """Retrieves the JWKS from the Cognito endpoint."""
    response = requests.get(JWKS_URL)
    response.raise_for_status()
    return response.json()["keys"]


JWKS_KEYS = get_jwks()


def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
   
        header = jwt.get_unverified_header(token)
        rsa_key = {}
        
    
        for key in JWKS_KEYS:
            if key['kid'] == header['kid']:
                rsa_key = key
                break
            
        if not rsa_key:
            raise credentials_exception

        
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            audience=COGNITO_CLIENT_ID, 
            issuer=f"https://cognito-idp.{AWS_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}", 
            options={"verify_at_hash": False} 
        )

     
        username: str = payload.get("cognito:username") or payload.get("username")
        email: str = payload.get("email")
        user_id: str = payload.get("sub")

        if user_id is None:
            raise credentials_exception
            
        return User(username=username, email=email, sub=user_id)

    except JWTError: 
        raise credentials_exception
    except Exception as e:
        print(f"Error validating token: {e}")
        raise credentials_exception
   
