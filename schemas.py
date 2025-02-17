from pydantic import BaseModel
from typing import Optional, List

class UserLogin(BaseModel):
    username: str
    password: str

class UserRegister(BaseModel):
    idno: int
    lastname: str
    firstname: str
    midname: Optional[str] = None
    course: str
    yearlevel: int
    email: str
    username: str
    password: str

class UserUpdate(BaseModel):
    firstname: str
    midname: Optional[str] = None
    lastname: str
    course: str
    yearlevel: int
    email: str

class PasswordChange(BaseModel):
    currentPassword: str
    newPassword: str
    confirmPassword: str

class UserResponse(BaseModel):
    idno: int
    firstname: str
    midname: str
    lastname: str
    course: str
    yearlevel: int
    email: str
    username: str
    role: str

class UserwSessionResponse(BaseModel):
    idno: int
    firstname: str
    midname: Optional[str] = None
    lastname: str
    course: Optional[str] = None
    yearlevel: Optional[int] = None
    email: str
    username: str
    role: str
    penalties: Optional[str] = None
    session_no: Optional[int] = None

class StudentReport(BaseModel):
    idno: int
    firstname: str
    midname: Optional[str] = None
    lastname: str
    course: Optional[str] = None
    yearlevel: Optional[int] = None
    email: str
    username: str
    role: str
    session_start: str
    session_end: Optional[str] = None
    purpose: Optional[str] = None
    room_no: Optional[int] = None

class SitInSession(BaseModel):
    student_id: int
    purpose: str
    reservation_date: str 
    reservation_time: str

class StudentReservation(BaseModel):
    idno: int
    firstname: str
    midname: Optional[str] = None
    lastname: str
    course: Optional[str] = None
    yearlevel: Optional[int] = None
    email: str
    username: str
    role: str
    purpose: Optional[str] = None
    reservation_date: str
    reservation_time: str
    room_no: Optional[int] = None

class ReservationRequest(BaseModel):
    idno: int
    firstname: str
    midname: Optional[str] = None
    lastname: str
    course: Optional[str] = None
    yearlevel: Optional[int] = None
    email: str
    username: str
    role: str
    purpose: Optional[str] = None
    reservation_date: str
    reservation_time: str
    room_no: Optional[int] = None
    status: str

class Student(BaseModel):
    id: int
    idno: int 
    firstname: str
    midname: Optional[str] = None
    lastname: str
    course: str
    yearlevel: int
    email: str
    session_no: int 
    session_start: Optional[str] = None
    session_end: Optional[str] = None  
    status: Optional[str] = None

class ReservationUpdate(BaseModel):
    idno: int
    date: str
    time: str
    reason: str = None

class ResponseResReqMessage(BaseModel):
    message: str

class LoginStudentRequest(BaseModel):
    idno: int
    room_no: int
    purpose: str

class LogoutStudentRequest(BaseModel):
    idno: int

class PenaltyResponse(BaseModel):
    penalties_name: str
    penalties_description: str

class StudentDataResponse(BaseModel):
    idno: int
    firstname: str
    midname: Optional[str] = None
    lastname: str
    course: str
    year: int
    email: str
    status: str

class CountResponse(BaseModel):
    count: int

class GraphData(BaseModel):
    labels: List[str]
    values: List[int]

class ReportRequest(BaseModel):
    report_type: str  
