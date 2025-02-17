import sqlite3

DB_NAME = "sit_in_monitoring.db"

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row  # Enable dictionary-like row access
    return conn

def create_tables():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        idno INTEGER UNIQUE NOT NULL,
        lastname TEXT NOT NULL,
        firstname TEXT NOT NULL,
        midname TEXT,
        course TEXT NOT NULL,
        yearlevel INT NOT NULL,
        email TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT CHECK(role IN ('student', 'staff', 'admin')) NOT NULL,
        status VARCHAR(10) CHECK(role IN ('IN USE', 'COMPLETED')),
        isdeleted BIT NOT NULL DEFAULT 0
    )''')

    cursor.execute('''CREATE TABLE IF NOT EXISTS student_sessions_time (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL, 
        purpose TEXT NULL,
        session_start DATETIME,
        session_end DATETIME,  
        room_no int,
        FOREIGN KEY (student_id) REFERENCES users(idno) ON DELETE CASCADE
    );
    ''')

    cursor.execute('''CREATE TABLE IF NOT EXISTS student_reservation (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        purpose TEXT NOT NULL,
        reservation_date DATE NOT NULL,
        reservation_time TEXT NOT NULL,
        room_no INT,
        status VARCHAR(10) CHECK(role IN ('APPROVED', 'PENDING', 'DECLINED')) DEFAULT 'PENDING',
        declined_reason VARCHAR(100),
        FOREIGN KEY(student_id) REFERENCES users(idno) ON DELETE CASCADE
    )''')

    cursor.execute('''CREATE TABLE IF NOT EXISTS student_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        session_no INT,
        FOREIGN KEY(student_id) REFERENCES users(idno) ON DELETE CASCADE
    )''')

    cursor.execute('''CREATE TABLE IF NOT EXISTS student_penalties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL, 
        penalties_name VARCHAR(50) NULL,
        penalties_description VARCHAR(150) NULL,
        FOREIGN KEY(student_id) REFERENCES users(idno) ON DELETE CASCADE
    )''')

    conn.commit()
    conn.close()

create_tables()
