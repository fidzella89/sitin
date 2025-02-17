from fastapi import APIRouter, HTTPException
from database import get_db_connection
from datetime import datetime
from typing import List
from schemas import Student, LoginStudentRequest, LogoutStudentRequest, ReservationUpdate, ResponseResReqMessage, PenaltyResponse, StudentDataResponse

router = APIRouter()

@router.get("/student_status", response_model=StudentDataResponse)
def get_student_status(studentId: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT idno, firstname, midname, lastname, course, yearlevel, email, status FROM users WHERE idno = ?", (studentId,))
        student = cursor.fetchone()
        conn.close()

        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        return StudentDataResponse(
            idno=student[0], firstname=student[1], midname=student[2], lastname=student[3],
            course=student[4], year=student[5], email=student[6], status=student[7]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/students/info")
def get_students():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT u.id, u.idno, u.firstname, u.midname, u.lastname, 
            COALESCE(u.course, 'Unknown'), 
            COALESCE(u.yearlevel, 0), 
            u.email, 
            COALESCE(s.session_no, 0),  
            st.session_start, 
            st.session_end, 
            COALESCE(u.status, 'UNKNOWN') AS status
        FROM users u
        LEFT JOIN student_sessions s ON u.idno = s.student_id
        LEFT JOIN (
            SELECT st.student_id, st.session_start, st.session_end
            FROM student_sessions_time st
            WHERE (st.student_id, st.session_start) IN (
                SELECT student_id, MAX(session_start)
                FROM student_sessions_time
                GROUP BY student_id
            )
        ) st ON u.idno = st.student_id
        WHERE u.role = 'student' AND u.isdeleted = 0;
    ''')
    
    students = []
    for row in cursor.fetchall():
        student = Student(
            id=row[0],
            idno=row[1],
            firstname=row[2],
            midname=row[3],
            lastname=row[4],
            course=row[5],
            yearlevel=row[6],
            email=row[7],
            session_no=row[8],
            session_start=row[9],
            session_end=row[10],
            status=row[11]
        )
        students.append(student.dict())
    conn.close()
    return students

@router.get("/student_logs/months")
def get_month_year_options(studentId: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            SELECT DISTINCT strftime('%m-%Y', session_start) as month_year
            FROM student_sessions_time
            WHERE student_id = ?
            ORDER BY session_start DESC
        ''', (studentId,))
        months = cursor.fetchall()
        if not months:
            return []

        formatted_months = []
        for month in months:
            try:
                date_obj = datetime.strptime(month[0], '%m-%Y')
                display = date_obj.strftime('%B %Y')
                formatted_months.append({
                    "value": month[0],
                    "label": display
                })
            except ValueError:
                continue

        return formatted_months
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.get("/student_logs")
def get_student_logs(studentId: str, monthYear: str = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        query = '''
            SELECT session_start, session_end, purpose, room_no
            FROM student_sessions_time
            WHERE student_id = ?
        '''
        params = [studentId]

        if monthYear:
            query += " AND strftime('%m-%Y', session_start) = ?"
            params.append(monthYear)

        cursor.execute(query, tuple(params))
        logs = []
        for row in cursor.fetchall():
            start = datetime.strptime(row[0], '%Y-%m-%d %H:%M:%S')
            end = datetime.strptime(row[1], '%Y-%m-%d %H:%M:%S') if row[1] else None
            duration = str(end - start) if end else "Ongoing"
            logs.append({
                "session_start": row[0],
                "session_end": row[1],
                "duration": duration,
                "purpose": row[2],
                "room_no": row[3]
            })
        return logs
    finally:
        conn.close()

@router.post("/student/login")
def login_student(request: LoginStudentRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Check session count from student_sessions
        cursor.execute("SELECT session_no FROM student_sessions WHERE student_id = ?", (request.idno,))
        session = cursor.fetchone()
        if not session:
            raise HTTPException(status_code=404, detail="Student not found in sessions")

        session_no = session[0]
        if session_no <= 0:
            raise HTTPException(status_code=400, detail="No remaining sessions")

        # Insert into student_sessions_time
        cursor.execute(
            "INSERT INTO student_sessions_time (student_id, purpose, session_start, room_no) VALUES (?, ?, ?, ?)",
            (request.idno, request.purpose, datetime.now().strftime("%Y-%m-%d %H:%M:%S"), request.room_no)
        )

        # Decrement session_no in student_sessions
        cursor.execute(
            "UPDATE student_sessions SET session_no = session_no - 1 WHERE student_id = ?",
            (request.idno,)
        )

        # Update user status to IN USE
        cursor.execute(
            "UPDATE users SET status = 'IN USE' WHERE idno = ?",
            (request.idno,)
        )

        conn.commit()
        return {"message": "Student logged in successfully"}

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.post("/student/logout")
def logout_student(request: LogoutStudentRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Update session_end for the latest session with an empty end time
        cursor.execute(
            """
            UPDATE student_sessions_time
            SET session_end = ?
            WHERE id = (
                SELECT id FROM student_sessions_time
                WHERE student_id = ? AND session_end IS NULL
                ORDER BY session_start DESC
                LIMIT 1
            )
            """,
            (datetime.now().strftime("%Y-%m-%d %H:%M:%S"), request.idno)
        )

        # Update user status
        cursor.execute("UPDATE users SET status = ? WHERE idno = ?", ("COMPLETED", request.idno))

        conn.commit()
        return {"message": "Student logged out successfully"}

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.post("/students/reset-sessions")
def reset_sessions():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Correct way to join tables in UPDATE for SQLite
        cursor.execute("""
        UPDATE student_sessions
        SET session_no = CASE 
            WHEN (SELECT course FROM users WHERE users.idno = student_sessions.student_id) IN ('BSIT', 'BSCS') THEN 30
            ELSE 15
        END
        WHERE EXISTS (SELECT 1 FROM users WHERE users.idno = student_sessions.student_id);
        """)
        
        conn.commit()
        return {"message": "Sessions reset successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.put("/students/delete")
def delete_student(data: dict):
    idno = data.get("idno")
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE users SET isdeleted = 1 WHERE idno = ?", (idno,))
        conn.commit()
        return {"message": "Student deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.put("/student/accept", response_model=ResponseResReqMessage)
def accept_reservation(data: ReservationUpdate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE student_reservation 
            SET status = 'APPROVED' 
            WHERE student_id = ? AND reservation_date = ? AND reservation_time = ?
        """, (data.idno, data.date, data.time))
        conn.commit()
        return ResponseResReqMessage(message="Reservation Schedule Approved Successfully!")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.put("/student/reject", response_model=ResponseResReqMessage)
def reject_reservation(data: ReservationUpdate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE student_reservation 
            SET status = 'DECLINED', declined_reason = ? 
            WHERE student_id = ? AND reservation_date = ? AND reservation_time = ?
        """, (data.reason, data.idno, data.date, data.time))
        conn.commit()
        return ResponseResReqMessage(message="Reservation Schedule Declined Successfully!")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.get("/student_penalties", response_model=List[PenaltyResponse])
def get_student_penalties(studentId: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT penalties_name, penalties_description FROM student_penalties WHERE student_id = ?", (studentId,))
        penalties = cursor.fetchall()
        conn.close()

        result = [{"penalties_name": p[0], "penalties_description": p[1]} for p in penalties]
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))