import requests
import jwt
import secrets
import datetime
from fastapi import APIRouter, HTTPException, Depends, Response, Request
from database import get_db_connection
from schemas import UserLogin, UserResponse
import bcrypt

router = APIRouter()

SECRET_KEY = secrets.token_hex(32) 

def generate_token(idno: int, username: str, role: str):
    expiration_time = datetime.datetime.utcnow() + datetime.timedelta(days=1)  
    payload = {
        "idno": idno,
        "username": username,
        "role": role,
        "exp": expiration_time
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
    return token

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

import requests 

@router.post("/login", response_model=UserResponse)
def login(user: UserLogin, response: Response):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM users WHERE username = ?", (user.username,))
    db_user = cursor.fetchone()

    if not db_user or not bcrypt.checkpw(user.password.encode(), db_user["password"].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    idno = db_user["idno"]
    username = db_user["username"]
    role = db_user["role"]

    session_token = generate_token(idno, username, role)
    response.set_cookie("token", session_token, max_age=60*60*24, httponly=True, secure=True, samesite="Strict")

    try:
        session_response = requests.post(f"http://localhost:8000/session/start/{idno}", timeout=5)
        session_data = session_response.json()
    except requests.exceptions.RequestException as e:
        session_data = {"error": str(e)} 

    return {
        "idno": idno,
        "username": db_user["username"],
        "lastname": db_user["lastname"],
        "firstname": db_user["firstname"],
        "course": db_user["course"] if db_user["course"] is not None else "", 
        "yearlevel": db_user["yearlevel"] if db_user["yearlevel"] is not None else 0,
        "midname": db_user["midname"] if db_user["midname"] is not None else "",
        "email": db_user["email"],
        "role": db_user["role"],
        "session": session_data  
    }

@router.get("/check-session")
def check_session(request: Request):
    token = request.cookies.get("token")
    if token:
        try:
            user = verify_token(token)
            return {
                "authenticated": True,
                "user": user
            }
        except HTTPException:
            return {
                "authenticated": False,
                "user": None
            }, 401
    return {
        "authenticated": False,
        "user": None
    }, 401

@router.post("/logout")
def logout(response: Response):
    response.set_cookie("token", "", expires=0)
    return {"message": "Logged out successfully"}
