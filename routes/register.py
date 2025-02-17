from fastapi import APIRouter, HTTPException
from database import get_db_connection
from passlib.context import CryptContext
from schemas import UserRegister
import bcrypt

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

@router.post("/")
async def register_user(user: UserRegister):  
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        user.idno = int(user.idno)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid IDNO format.")

    # Check if firstname & lastname already exist
    cursor.execute("SELECT id FROM users WHERE firstname = ? AND lastname = ?", (user.firstname, user.lastname))
    existing_name = cursor.fetchone()
    if existing_name:
        return {"error": "name_exists", "message": "You already registered. Please login."}

    # Check if email already exists
    cursor.execute("SELECT id FROM users WHERE email = ?", (user.email,))
    existing_email = cursor.fetchone()
    if existing_email:
        return {"error": "email_exists", "message": "Email already registered."}

    # Hash password
    hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    # Determine session_no
    course_upper = user.course.upper()
    session_no = 30 if course_upper in ["BSIT", "BSCS"] else 15

    # Insert new user
    cursor.execute(
        """INSERT INTO users (idno, lastname, firstname, midname, course, yearlevel, email, username, password, role)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (user.idno, user.lastname, user.firstname, user.midname, user.course, user.yearlevel, user.email, user.username, hashed_password, "student")
    )

    # Insert into student_sessions
    cursor.execute(
        "INSERT INTO student_sessions (student_id, session_no) VALUES (?, ?)",
        (user.idno, session_no)
    )

    conn.commit()
    conn.close()

    return {"message": "Registration successful!"}