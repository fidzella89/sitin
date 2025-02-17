from fastapi import APIRouter, Query, HTTPException, Depends
from database import get_db_connection
from typing import List, Optional
from datetime import datetime
from schemas import StudentReport

router = APIRouter()

@router.get("/records", response_model=List[StudentReport])
def get_student_records(
    date_filter: Optional[str] = Query("All"),
    selected_date: Optional[str] = Query(None),
    course_year_filter: Optional[str] = Query("All"),
    selected_course: Optional[str] = Query(None),
    selected_year: Optional[str] = Query(None),
    purpose_filter: Optional[str] = Query("All"),
    room_filter: Optional[str] = Query("All"),
    search: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("session_start"),
    order: Optional[str] = Query("desc")
):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
        SELECT users.idno, users.firstname, users.midname, users.lastname, 
               users.course, users.yearlevel, users.email, users.username, users.role, 
               student_sessions_time.session_start, student_sessions_time.session_end,
               student_sessions_time.purpose, student_sessions_time.room_no
        FROM users
        JOIN student_sessions_time ON users.idno = student_sessions_time.student_id
    """
    filters = []
    params = []
    
    if date_filter != "All" and selected_date:
        if date_filter == "Year":
            filters.append("strftime('%Y', session_start) = ?")
        elif date_filter == "Month & Year":
            filters.append("strftime('%Y-%m', session_start) = ?")
        elif date_filter == "Month,Day,Year":
            filters.append("strftime('%Y-%m-%d', session_start) = ?")
        params.append(selected_date)
    
    if course_year_filter != "All":
        if course_year_filter == "Course" and selected_course:
            filters.append("course = ?")
            params.append(selected_course)
        elif course_year_filter == "Year Level" and selected_year:
            filters.append("yearlevel = ?")
            params.append(selected_year)
        elif course_year_filter == "Course & Year" and selected_course and selected_year:
            filters.append("course = ? AND yearlevel = ?")
            params.extend([selected_course, selected_year])
    
    if purpose_filter != "All":
        if purpose_filter == "Other":
            filters.append("purpose LIKE 'Other:%'")
        else:
            filters.append("purpose = ?")
            params.append(purpose_filter)
    
    if room_filter != "All":
        filters.append("room_no = ?")
        params.append(room_filter)
    
    if search:
        filters.append("(firstname LIKE ? OR lastname LIKE ? OR idno LIKE ?)")
        params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])
    
    if filters:
        query += " WHERE " + " AND ".join(filters)
    
    if sort_by not in ["session_start", "lastname", "course", "yearlevel"]:
        sort_by = "session_start"
    if order.lower() not in ["asc", "desc"]:
        order = "desc"
    query += f" ORDER BY {sort_by} {order.upper()}"
    
    cursor.execute(query, params)
    records = cursor.fetchall()
    conn.close()
    
    return [dict(record) for record in records]
