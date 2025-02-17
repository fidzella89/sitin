from fastapi import APIRouter, HTTPException
from database import get_db_connection
from schemas import ReportRequest

router = APIRouter()

@router.get("/view_users")
def view_users():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, role FROM users")
    users = cursor.fetchall()
    return {"users": [dict(user) for user in users]}

@router.delete("/delete_user/{user_id}")
def delete_user(user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    return {"message": f"User {user_id} deleted successfully"}

@router.post("/generate_report")
def generate_report(request: ReportRequest):
    conn = get_db_connection()
    cursor = conn.cursor()

    if request.report_type == "purpose":
        cursor.execute("SELECT purpose, COUNT(*) AS count FROM sit_in_sessions GROUP BY purpose")
    elif request.report_type == "year_level":
        cursor.execute("SELECT year_level, COUNT(*) AS count FROM sit_in_sessions GROUP BY year_level")
    else:
        raise HTTPException(status_code=400, detail="Invalid report type")

    report_data = cursor.fetchall()
    return {"report": [dict(row) for row in report_data]}
