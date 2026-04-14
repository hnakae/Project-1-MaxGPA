# (robert)
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "maxgpa.db")
SCHEMA_PATH = os.path.join(os.path.dirname(__file__), "schema.sql")

def seed_database():
    # Connect to (or create) the database
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Initialize Schema
    with open(SCHEMA_PATH, 'r') as f:
        cursor.executescript(f.read())

    # 2. Add Starter Terms
    terms = [("Fall 2025", 1), ("Winter 2026", 0)]
    cursor.executemany("INSERT INTO terms (name, is_completed) VALUES (?, ?)", terms)
    
    # Get the ID of the first term
    fall_id = 1 

    # 3. Add Starter Courses
    courses = [
        (fall_id, "Data Structures", 4, 4.0, "A"),
        (fall_id, "Linear Algebra", 4, 3.7, "A-"),
        (fall_id, "Operating Systems", 4, 3.3, "B+")
    ]
    cursor.executemany(
        "INSERT INTO courses (term_id, name, credits, grade_point, letter_grade) VALUES (?, ?, ?, ?, ?)", 
        courses
    )

    conn.commit()
    conn.close()
    print(f"✅ Success: {DB_PATH} created and seeded!")

if __name__ == "__main__":
    seed_database()