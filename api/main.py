from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
import sqlite3
import os
import sys
from typing import Optional
import shutil

app = FastAPI()

DB_DIRECTORY = os.path.join( 
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "db"
)

DB_PATH = os.path.join(
    DB_DIRECTORY, "grade_data.db"
)

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db import database

_AY_EXPR = """
    CASE WHEN TermDesc LIKE 'Fall%'
         THEN CAST(SUBSTR(TermDesc, -4) AS INTEGER) + 1
         ELSE CAST(SUBSTR(TermDesc, -4) AS INTEGER)
    END
"""


def get_db(db_path = DB_PATH):
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


class GroupIn(BaseModel):
    major: str
    groupName: str
    type: str
    sortOrder: int = 0


class RequirementIn(BaseModel):
    major: str
    groupId: int
    subject: str
    courseNumber: str
    sequenceTag: Optional[str] = None


@app.get("/api/requirements")
async def get_requirements(major: str, db_path=DB_PATH):
    conn = get_db(db_path=db_path)
    groups = conn.execute(
        "SELECT GroupID, GroupName, Type, SortOrder FROM Requirement_Groups WHERE Major = ? ORDER BY SortOrder",
        (major,),
    ).fetchall()

    result = []
    for g in groups:
        courses = conn.execute(
            """
            SELECT r.ReqID, r.Subject || ' ' || r.CourseNumber AS code,
                   ct.Title, r.SequenceTag
            FROM Major_Requirements r
            LEFT JOIN CourseTitles ct
                   ON ct.Subject = r.Subject AND ct.CourseNumber = r.CourseNumber
            WHERE r.GroupID = ?
            ORDER BY r.SequenceTag, r.Subject, r.CourseNumber
            """,
            (g["GroupID"],),
        ).fetchall()
        result.append({
            "groupId": g["GroupID"],
            "groupName": g["GroupName"],
            "type": g["Type"],
            "sortOrder": g["SortOrder"],
            "courses": [
                {"id": c["ReqID"], "code": c["code"], "name": c["Title"], "sequenceTag": c["SequenceTag"]}
                for c in courses
            ],
        })
    conn.close()
    return result


@app.post("/api/requirement-groups")
async def add_group(body: GroupIn, db_path=DB_PATH):
    conn = get_db(db_path=db_path)
    cur = conn.execute(
        "INSERT INTO Requirement_Groups (Major, GroupName, Type, SortOrder) VALUES (?, ?, ?, ?)",
        (body.major, body.groupName, body.type, body.sortOrder),
    )
    conn.commit()
    group_id = cur.lastrowid
    conn.close()
    return {"groupId": group_id}


@app.delete("/api/requirement-groups/{group_id}")
async def delete_group(group_id: int, db_path=DB_PATH):
    conn = get_db(db_path=db_path)
    conn.execute("DELETE FROM Requirement_Groups WHERE GroupID = ?", (group_id,))
    conn.commit()
    conn.close()
    return {"ok": True}


@app.post("/api/requirements")
async def add_requirement(body: RequirementIn, db_path=DB_PATH):
    parts = body.subject.strip(), body.courseNumber.strip()
    conn = get_db(db_path=db_path)
    try:
        cur = conn.execute(
            "INSERT INTO Major_Requirements (GroupID, Major, Subject, CourseNumber, SequenceTag) VALUES (?, ?, ?, ?, ?)",
            (body.groupId, body.major, parts[0], parts[1], body.sequenceTag or None),
        )
        conn.commit()
        req_id = cur.lastrowid
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=409, detail="Requirement already exists in this group")
    conn.close()
    return {"id": req_id}

@app.post("/api/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    file_path = DB_DIRECTORY + "/" + file.filename
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {str(e)}")
    finally:
        await file.close()

    return {"filename": file.filename}

@app.delete("/api/requirements/{req_id}")
async def delete_requirement(req_id: int, db_path=DB_PATH):
    conn = get_db(db_path=db_path)
    conn.execute("DELETE FROM Major_Requirements WHERE ReqID = ?", (req_id,))
    conn.commit()
    conn.close()
    return {"ok": True}


@app.get("/api/instructors")
async def get_instructors(subject: Optional[str] = None):
    conn = get_db()
    if subject:
        rows = conn.execute(
            "SELECT DISTINCT Instructor FROM Course_Records WHERE Subject = ? AND Instructor IS NOT NULL ORDER BY Instructor",
            (subject,),
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT DISTINCT Instructor FROM Course_Records WHERE Instructor IS NOT NULL ORDER BY Instructor"
        ).fetchall()
    conn.close()
    return [r["Instructor"] for r in rows]


@app.get("/api/course-instructors")
async def get_course_instructors(code: str, limit: int = 5):
    parts = code.strip().split(" ", 1)
    subject = parts[0]
    course_number = parts[1] if len(parts) > 1 else ""

    conn = get_db()
    rows = conn.execute(
        """
        SELECT
            Instructor,
            SUM(Grade_A)   AS a,
            SUM(Grade_B)   AS b,
            SUM(Grade_C)   AS c,
            SUM(Grade_DNF) AS dnf
        FROM Course_Records
        WHERE Subject = ? AND CourseNumber = ? AND Instructor IS NOT NULL
        GROUP BY Instructor
        HAVING (a + b + c + dnf) > 0
        ORDER BY (a * 4.0 + b * 3.0 + c * 2.0) / (a + b + c + dnf) DESC
        LIMIT ?
        """,
        (subject, course_number, limit),
    ).fetchall()
    conn.close()

    results = []
    for row in rows:
        a, b, c, dnf = row["a"] or 0, row["b"] or 0, row["c"] or 0, row["dnf"] or 0
        total = a + b + c + dnf
        if total == 0:
            continue
        avg_gpa = (a * 4.0 + b * 3.0 + c * 2.0) / total
        results.append({
            "instructor": row["Instructor"],
            "avgGpa": round(avg_gpa, 2),
            "gradeData": [
                {"grade": "A",   "count": a,   "percentage": round(a   / total * 100, 1)},
                {"grade": "B",   "count": b,   "percentage": round(b   / total * 100, 1)},
                {"grade": "C",   "count": c,   "percentage": round(c   / total * 100, 1)},
                {"grade": "DNF", "count": dnf, "percentage": round(dnf / total * 100, 1)},
            ],
        })
    return results


@app.get("/api/bulk-best-instructors")
async def get_bulk_best_instructors(codes: str):
    code_list = [c.strip() for c in codes.split(",") if c.strip()]
    if not code_list:
        return {}

    conn = get_db()
    results = {}

    for code in code_list:
        parts = code.split(" ", 1)
        subject = parts[0]
        course_number = parts[1] if len(parts) > 1 else ""

        row = conn.execute(
            """
            SELECT
                Instructor,
                SUM(Grade_A)   AS a,
                SUM(Grade_B)   AS b,
                SUM(Grade_C)   AS c,
                SUM(Grade_DNF) AS dnf
            FROM Course_Records
            WHERE Subject = ? AND CourseNumber = ? AND Instructor IS NOT NULL
            GROUP BY Instructor
            HAVING (a + b + c + dnf) > 0
            ORDER BY (a * 4.0 + b * 3.0 + c * 2.0) / (a + b + c + dnf) DESC
            LIMIT 1
            """,
            (subject, course_number),
        ).fetchone()

        if row:
            a, b, c, dnf = row["a"] or 0, row["b"] or 0, row["c"] or 0, row["dnf"] or 0
            total = a + b + c + dnf
            avg_gpa = (a * 4.0 + b * 3.0 + c * 2.0) / total
            results[code] = {
                "instructor": row["Instructor"],
                "avgGpa": round(avg_gpa, 2),
                "gradeData": [
                    {"grade": "A",   "count": a,   "percentage": round(a   / total * 100, 1)},
                    {"grade": "B",   "count": b,   "percentage": round(b   / total * 100, 1)},
                    {"grade": "C",   "count": c,   "percentage": round(c   / total * 100, 1)},
                    {"grade": "DNF", "count": dnf, "percentage": round(dnf / total * 100, 1)},
                ],
            }
    conn.close()
    return results


@app.get("/api/subjects")
async def get_subjects():
    conn = get_db()
    rows = conn.execute(
        "SELECT DISTINCT Subject FROM Course_Records ORDER BY Subject"
    ).fetchall()
    conn.close()
    return [r["Subject"] for r in rows]


@app.get("/api/academic-years")
async def get_academic_years():
    conn = get_db()
    rows = conn.execute(
        f"SELECT DISTINCT ({_AY_EXPR}) AS ay FROM Course_Records ORDER BY ay"
    ).fetchall()
    conn.close()
    # 2016 → "AY16", 2023 → "AY23"
    return [f"AY{str(r['ay'])[2:]}" for r in rows]


@app.get("/api/courses")
async def get_courses(
    subject: Optional[str] = None,
    subjects: Optional[str] = None,
    years: Optional[str] = None,
    search: Optional[str] = None,
    instructor: Optional[str] = None,
):
    conn = get_db()

    conditions: list[str] = []
    params: list = []

    if subjects:
        subj_list = [s.strip() for s in subjects.split(",") if s.strip()]
        placeholders = ",".join("?" * len(subj_list))
        conditions.append(f"cr.Subject IN ({placeholders})")
        params.extend(subj_list)
    elif subject:
        conditions.append("cr.Subject = ?")
        params.append(subject)

    if years:
        ay_list = [
            int(y.replace("AY", "20"))
            for y in years.split(",")
            if y.startswith("AY") and len(y) == 4
        ]
        if ay_list:
            placeholders = ",".join("?" * len(ay_list))
            ay_expr = _AY_EXPR.replace("TermDesc", "cr.TermDesc")
            conditions.append(f"({ay_expr}) IN ({placeholders})")
            params.extend(ay_list)

    if search:
        conditions.append("(cr.Subject || ' ' || cr.CourseNumber LIKE ?)")
        params.append(f"%{search}%")

    if instructor:
        conditions.append("cr.Instructor = ?")
        params.append(instructor)

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    rows = conn.execute(
        f"""
        SELECT
            cr.Subject,
            cr.CourseNumber,
            cr.Subject || ' ' || cr.CourseNumber AS code,
            ct.Title,
            SUM(cr.Grade_A)   AS a,
            SUM(cr.Grade_B)   AS b,
            SUM(cr.Grade_C)   AS c,
            SUM(cr.Grade_DNF) AS dnf,
            SUM(cr.TOT_NON_W) AS total
        FROM Course_Records cr
        LEFT JOIN CourseTitles ct ON ct.Subject = cr.Subject AND ct.CourseNumber = cr.CourseNumber
        {where}
        GROUP BY cr.Subject, cr.CourseNumber
        ORDER BY cr.Subject, cr.CourseNumber
        LIMIT 500
        """,
        params,
    ).fetchall()
    conn.close()

    results = []
    for row in rows:
        a, b, c, dnf = row["a"] or 0, row["b"] or 0, row["c"] or 0, row["dnf"] or 0
        total = a + b + c + dnf
        if total == 0:
            continue

        avg_gpa = (a * 4.0 + b * 3.0 + c * 2.0) / total
        results.append({
            "code": row["code"],
            "name": row["Title"],
            "avgGpa": round(avg_gpa, 2),
            "gradeData": [
                {"grade": "A",   "count": a,   "percentage": round(a   / total * 100, 1)},
                {"grade": "B",   "count": b,   "percentage": round(b   / total * 100, 1)},
                {"grade": "C",   "count": c,   "percentage": round(c   / total * 100, 1)},
                {"grade": "DNF", "count": dnf, "percentage": round(dnf / total * 100, 1)},
            ],
        })

    return results
