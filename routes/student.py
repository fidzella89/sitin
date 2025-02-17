import bcrypt
from fastapi import APIRouter, HTTPException, Depends
from database import get_db_connection
from schemas import SitInSession, UserUpdate, PasswordChange, UserResponse, UserwSessionResponse
from datetime import datetime

router = APIRouter()

@router.post("/reserve")
def make_reservation(session: SitInSession):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO student_reservation (student_id, purpose, reservation_date, reservation_time) VALUES (?, ?, ?, ?)",
        (session.student_id, session.purpose, session.reservation_date, session.reservation_time),
    )
    conn.commit()
    conn.close()
    
    return {"message": "Reservation successful"}

@router.get("/reservations/{student_id}/{date}")
def get_reservations(student_id: int, date: str):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id, purpose, reservation_time, status, declined_reason 
        FROM student_reservation 
        WHERE student_id = ? AND reservation_date = ? 
        ORDER BY 
            time(reservation_time),
            purpose ASC        
        """,
        (student_id, date)
    )
    
    reservations = cursor.fetchall()
    conn.close()

    # Format the results
    formatted_reservations = [
        {"id": row[0], "purpose": row[1], "time": row[2], "status": row[3], "declined_reason": row[4]} for row in reservations
    ]

    return {
        "reservations": formatted_reservations,
    }

# Endpoint to fetch student information
@router.get("/{username}", response_model=UserwSessionResponse)
def get_student_info(username: str):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT u.idno, u.firstname, u.midname, u.lastname, u.course, u.yearlevel, u.email, u.username, u.role, sp.penalties, s.session_no
        FROM users u 
        LEFT JOIN student_sessions s ON u.idno = s.student_id 
        LEFT JOIN student_penalties sp ON u.idno = sp.student_id
        WHERE u.username = ?
        """, 
        (username,)
    )

    user = cursor.fetchone()
    conn.close()

    if user:
        return UserwSessionResponse(
            idno=user[0], 
            firstname=user[1], 
            midname=user[2], 
            lastname=user[3], 
            course=user[4],
            yearlevel=user[5],
            email=user[6], 
            username=user[7], 
            role=user[8],
            penalties=user[9],
            session_no=user[10]
        )
    else:
        raise HTTPException(status_code=404, detail="User not found")

# Endpoint to update student information
@router.put("/edit/{username}", response_model=UserResponse)
async def update_student_info(username: str, user_update: UserUpdate):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if the student exists by username
    cursor.execute("SELECT idno, firstname, midname, lastname, course, yearlevel, email, username, role FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if the email already exists in another student's record (excluding the current student)
    cursor.execute("SELECT username FROM users WHERE email = ? AND username != ?", (user_update.email, username))
    existing_user = cursor.fetchone()

    if existing_user:
        raise HTTPException(status_code=400, detail="The Info Already Exists")

    if (user[1] == user_update.firstname and
        user[2] == user_update.midname and
        user[3] == user_update.lastname and
        user[3] == user_update.course and
        user[3] == user_update.yearlevel and
        user[4] == user_update.email):
        return UserResponse(
            idno=user[0],
            firstname=user[1],
            midname=user[2],
            lastname=user[3],
            course=user[4],
            yearlevel=user[5],
            email=user[6], 
            username=user[7], 
            role=user[8],
        )

    cursor.execute("""
        UPDATE users SET firstname = ?, midname = ?, lastname = ?, course = ?, yearlevel = ?, email = ?
        WHERE username = ?
    """, (user_update.firstname, user_update.midname, user_update.lastname, user_update.course, user_update.yearlevel, user_update.email, username))

    conn.commit()

    cursor.execute("SELECT idno, firstname, midname, lastname, course, yearlevel, email, username, role FROM users WHERE username = ?", (username,))
    updated_user = cursor.fetchone()

    return UserResponse(
        idno=updated_user[0],
        firstname=updated_user[1],
        midname=updated_user[2],
        lastname=updated_user[3],
        course=user[4],
        yearlevel=user[5],
        email=user[6], 
        username=user[7], 
        role=user[8],
    )

@router.put("/change-password/{username}")
async def change_password(username: str, passwords: PasswordChange):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if the student exists by username
    cursor.execute("SELECT username, password FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Verify current password
    if not bcrypt.checkpw(passwords.currentPassword.encode('utf-8'), user[1].encode('utf-8')):
        raise HTTPException(status_code=400, detail="Incorrect current password")

    # Ensure new password and confirm password match
    if passwords.newPassword != passwords.confirmPassword:
        raise HTTPException(status_code=400, detail="New password and confirm password do not match")

    # Hash the new password
    hashed_password = bcrypt.hashpw(passwords.newPassword.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    # Update the password in the database
    cursor.execute(
        "UPDATE users SET password = ? WHERE username = ?",
        (hashed_password, username),
    )
    conn.commit()

    return {"message": "Password updated successfully"}

