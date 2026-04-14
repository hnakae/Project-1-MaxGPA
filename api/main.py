from fastapi import FastAPI
import pandas as pd
import sqlite3

app = FastAPI()

def get_db_connection():
    return sqlite3.connect("../db/maxgpa.db")

@app.get("/api/stats/course/{course_code}")
async def get_course_stats(course_code: str):
    conn = get_db_connection()
    # Peyton uses Pandas to handle the "Strip + and -" requirement
    df = pd.read_sql_query("SELECT * FROM courses WHERE name=?", conn, params=(course_code,))
    
    # Logic to aggregate grades A, B, C, DNF
    stats = {
        "labels": ["A", "B", "C", "DNF"],
        "data": [df['a_count'].sum(), df['b_count'].sum(), df['c_count'].sum(), df['dnf_count'].sum()]
    }
    return stats