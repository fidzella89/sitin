from fastapi import FastAPI, HTTPException
from database import get_db_connection

app = FastAPI()

@app.get("/users/{username}")
def get_user(username: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT firstname, midname, lastname, email FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    print (user)
    cursor.close()

    if user:
        # Return the user data as a dictionary, FastAPI will automatically convert it to JSON
        return {
            "firstname": user[0],
            "midname": user[1],
            "lastname": user[2],
            "email": user[3]
        }
    else:
        raise HTTPException(status_code=404, detail="User not found")
