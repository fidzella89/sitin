from fastapi import APIRouter, HTTPException, Depends
from database import get_db_connection
from datetime import datetime

router = APIRouter()

@router.post("/start/{idno}")
def start_session(idno: int):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if student already has an active session
    cursor.execute("""
        SELECT session_start 
        FROM student_sessions_time 
        WHERE student_id = ? AND session_end IS NULL 
        ORDER BY session_start DESC LIMIT 1
    """, (idno,))
    existing_session = cursor.fetchone()

    if existing_session:
        return {"message": "Session already active", "session_start": existing_session["session_start"]}

    # Insert new session
    session_start = datetime.now().isoformat()
    cursor.execute("INSERT INTO student_sessions_time (student_id, session_start) VALUES (?, ?)", (idno, session_start,))
    conn.commit()

    return {"message": "Session started", "session_start": session_start}

@router.get("/get-session-start/{idno}")
def get_session_start(idno: str):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT session_start FROM student_sessions_time WHERE student_id = ? AND session_end IS NULL", (idno,))
    session = cursor.fetchone()
    
    if not session:
        raise HTTPException(status_code=404, detail="No active session found")

    return {"session_start": session["session_start"]}
