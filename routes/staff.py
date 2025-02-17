from fastapi import APIRouter, Query, HTTPException
from database import get_db_connection
from typing import List, Optional
from schemas import StudentReservation, ReservationRequest

router = APIRouter()

@router.get("/reservation/upcoming", response_model=List[StudentReservation])
def get_student_reservation(
    date_filter: Optional[str] = Query("All"),
    selected_date: Optional[str] = Query(None),
    course_year_filter: Optional[str] = Query("All"),
    selected_course: Optional[str] = Query(None),
    selected_year: Optional[str] = Query(None),
    purpose_filter: Optional[str] = Query("All"),
    room_filter: Optional[str] = Query("All"),
    search: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("reservation_date"),
    order: Optional[str] = Query("desc")
):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
            SELECT users.idno, users.firstname, users.midname, users.lastname, 
                users.course, users.yearlevel, users.email, users.username, users.role, 
                student_reservation.purpose, student_reservation.reservation_date, student_reservation.reservation_time, 
                student_reservation.room_no
            FROM users
            JOIN student_reservation ON users.idno = student_reservation.student_id
            WHERE student_reservation.status = 'APPROVED'
        """
    filters = []
    params = []
    
    if date_filter != "All" and selected_date:
        if date_filter == "Year":
            filters.append("strftime('%Y', reservation_date) = ?")
        elif date_filter == "Month & Year":
            filters.append("strftime('%Y-%m', reservation_date) = ?")
        elif date_filter == "Month,Day,Year":
            filters.append("strftime('%Y-%m-%d', reservation_date) = ?")
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

    # Validate sorting
    valid_sort_fields = ["reservation_date", "lastname", "course", "yearlevel"]
    if sort_by not in valid_sort_fields:
        sort_by = "reservation_date"

    # Validate order
    order = order.lower()
    if order not in ["asc", "desc"]:
        order = "desc"

    # Add the final ORDER BY clause (only once)
    query += f"""
        ORDER BY
            CASE 
                WHEN student_reservation.reservation_date = DATE('now') THEN 1
                WHEN student_reservation.reservation_date > DATE('now') THEN 2
                ELSE 3
            END,
            student_reservation.reservation_date ASC,
            time(student_reservation.reservation_time) ASC,
            {sort_by} {order.upper()}
    """

    cursor.execute(query, params)
    records = cursor.fetchall()
    conn.close()
    
    return [dict(record) for record in records]

@router.get("/reservation/request", response_model=List[ReservationRequest])
def get_reservation_requests():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
                    SELECT users.idno, users.firstname, users.midname, users.lastname, 
                        users.course, users.yearlevel, users.email, users.username, users.role, 
                        student_reservation.purpose, student_reservation.reservation_date, student_reservation.reservation_time, 
                        student_reservation.room_no, student_reservation.status
                    FROM users
                    LEFT JOIN student_reservation ON users.idno = student_reservation.student_id
                    WHERE student_reservation.status = 'PENDING'
                """)
    reservations = cursor.fetchall()
    conn.close()
    return [dict(res) for res in reservations]