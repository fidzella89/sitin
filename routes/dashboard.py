from fastapi import APIRouter, Depends, HTTPException
from database import get_db_connection

router = APIRouter()

@router.get("/students/count")
def get_student_count():
    conn = get_db_connection()
    count = conn.execute("SELECT COUNT(*) FROM users WHERE role = 'student'").fetchone()[0]
    conn.close()
    return {"count": count}

@router.get("/months")
def get_months():
    conn = get_db_connection()
    months = conn.execute("""
        SELECT DISTINCT strftime('%Y-%m', session_start) as month
        FROM student_sessions_time
        ORDER BY month ASC;
    """).fetchall()
    conn.close()
    return [m[0] for m in months]

@router.get("/sessions/completed")
def get_completed_sessions(month: str):
    conn = get_db_connection()
    count = conn.execute("SELECT COUNT(*) FROM student_sessions_time WHERE strftime('%Y-%m', session_start) = ? AND session_end IS NOT NULL", (month,)).fetchone()[0]
    conn.close()
    return {"count": count}

@router.get("/sessions/running")
def get_running_sessions():
    conn = get_db_connection()
    sessions = conn.execute("SELECT room_no, COUNT(*) as count FROM student_sessions_time WHERE session_start IS NOT NULL AND session_end IS NULL GROUP BY room_no").fetchall()
    conn.close()
    return [{"room_no": s["room_no"], "count": s["count"]} for s in sessions]

@router.get("/sessions/graph")
def get_sessions_graph(month: str):
    conn = get_db_connection()
    data = conn.execute("SELECT DATE(session_start) as date, COUNT(*) as count FROM student_sessions_time WHERE strftime('%Y-%m', session_start) = ? GROUP BY date", (month,)).fetchall()
    conn.close()
    return {"labels": [d["date"] for d in data], "values": [d["count"] for d in data]}

@router.get("/reservations/graph")
def get_reservations_graph(month: str):
    conn = get_db_connection()
    approved = conn.execute("SELECT DATE(reservation_date) as date, COUNT(*) as count FROM student_reservation WHERE status = 'APPROVED' AND strftime('%Y-%m', reservation_date) = ? GROUP BY date", (month,)).fetchall()
    declined = conn.execute("SELECT DATE(reservation_date) as date, COUNT(*) as count FROM student_reservation WHERE status = 'DECLINED' AND strftime('%Y-%m', reservation_date) = ? GROUP BY date", (month,)).fetchall()
    conn.close()

    labels = list(set([a["date"] for a in approved] + [d["date"] for d in declined]))
    return {"labels": labels, "approved": [next((a["count"] for a in approved if a["date"] == label), 0) for label in labels], "declined": [next((d["count"] for d in declined if d["date"] == label), 0) for label in labels]}
