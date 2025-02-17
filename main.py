from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, student, staff, admin, register, session, report, sitin, dashboard

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(register.router, prefix="/register", tags=["Register"]) 
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(session.router, prefix="/session", tags=["Session"])
app.include_router(student.router, prefix="/students", tags=["Students"])
app.include_router(staff.router, prefix="/staff", tags=["Staff"])
app.include_router(sitin.router, prefix="/sitin", tags=["SitIn"])
app.include_router(report.router, prefix="/report", tags=["Report"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])


@app.get("/")
def root():
    return {"message": "Sit-in Monitoring System API Running!"}
