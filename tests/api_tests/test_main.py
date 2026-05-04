import pytest
import sys
import os
import asyncio
import shutil
import sqlite3
from fastapi import UploadFile
import io

parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
sys.path.append(parent_dir)

import api.main as api



# API TESTS
class TestAPI:
    @classmethod
    def setup_class(cls):
        cls.PATH = os.path.join(parent_dir, "db", "test_data.db")

        # Ensure clean test DB
        if os.path.exists(cls.PATH):
            os.remove(cls.PATH)

        shutil.copy(
            os.path.join(parent_dir, "db", "grade_data.db"),
            cls.PATH
        )

        cls.conn = sqlite3.connect(cls.PATH)
        cls.conn.row_factory = sqlite3.Row

        # Override API DB connection
        cls.original_get_db = api.get_db

        def get_test_db(db_path=None):
            conn = sqlite3.connect(cls.PATH)
            conn.row_factory = sqlite3.Row
            return conn

        api.get_db = get_test_db


    @classmethod
    def teardown_class(cls):
        api.get_db = cls.original_get_db
        cls.conn.close()

        if os.path.exists(cls.PATH):
            os.remove(cls.PATH)

    def test_add_delete_group(self):
        # Creates a group object from api file
        group = api.GroupIn(major = "TEST", groupName = "TEST_GROUP", type = "TEST_TYPE", sortOrder = 0)
        
        # Runs a asynchronous function synchronously and grabs the group ID
        tmp_id = asyncio.run(api.add_group(group, self.PATH))["groupId"]
        
        # Run the query and return an iterable data object from the database (asks for the data we just inserted)
        cur = self.conn.execute("SELECT * FROM Requirement_Groups WHERE GroupID = ?", (tmp_id,)).fetchall()
        
        # Assert that we succesfully grabbed the data we put in
        assert [dict(row) for row in cur] == [{'GroupID': tmp_id, 'Major': 'TEST', 'GroupName': 'TEST_GROUP', 'Type': 'TEST_TYPE', 'SortOrder': 0}]
        cur = self.conn.execute("SELECT * FROM Requirement_Groups WHERE GroupID = ?", (tmp_id,)).fetchall()
        
        # Checks that the data is there before we delete it
        assert [dict(row) for row in cur] == [{'GroupID': tmp_id, 'Major': 'TEST', 'GroupName': 'TEST_GROUP', 'Type': 'TEST_TYPE', 'SortOrder': 0}]
        
        # Delete the data
        asyncio.run(api.delete_group(tmp_id, self.PATH))
        cur = self.conn.execute("SELECT * FROM Requirement_Groups WHERE GroupID = ?", (tmp_id,)).fetchall()
        
        # Check that it is gone
        assert [dict(row) for row in cur] == []

    def test_add_delete_requirement(self):
        requirement = api.RequirementIn(major = "TEST", groupId = -1, subject = "TEST", courseNumber = "000")
        tmp_id = asyncio.run(api.add_requirement(requirement, self.PATH))["id"]
        cur = self.conn.execute("SELECT * FROM Major_Requirements WHERE ReqID = ?", (tmp_id,)).fetchall()
        assert [dict(row) for row in cur] == [{'ReqID': tmp_id, 'GroupID': -1, 'Major': 'TEST', 'Subject': 'TEST', 'CourseNumber': '000', 'SequenceTag': None}]
        cur = self.conn.execute("SELECT * FROM Major_Requirements WHERE ReqID = ?", (tmp_id,)).fetchall()
        assert [dict(row) for row in cur] == [{'ReqID': tmp_id, 'GroupID': -1, 'Major': 'TEST', 'Subject': 'TEST', 'CourseNumber': '000', 'SequenceTag': None}]
        asyncio.run(api.delete_requirement(tmp_id, self.PATH))
        cur = self.conn.execute("SELECT * FROM Major_Requirements WHERE ReqID = ?", (tmp_id,)).fetchall()
        assert [dict(row) for row in cur] == []

    def test_insert_csv(self):
        test_csv_data = "TERM,TERM_DESC,SUBJ,NUMB,CRN,INSTRUCTOR,AP,A,AM,BP,B,BM,CP,C,CM,DP,D,DM,F,P,N,OTHER,W,TOT_NON_W\n201601,Fall 2016,CS,606,10001,\"TEST, TEST TEST\",100,100,2,2,5,0,0,1,0,0,0,0,0,1,0,0,0,100"
        file_bytes = io.BytesIO(test_csv_data.encode('utf-8'))
        test = UploadFile(
            file=file_bytes,
            filename="test.csv"
        )
        asyncio.run(api.upload_csv(test, self.PATH))
        cur = self.conn.execute("SELECT * FROM Course_Records WHERE Subject = ? AND CourseNumber = ?", ("CS", "606")).fetchall()
        rows = [{k: v for k, v in dict(row).items() if k != 'RecordID'} for row in cur]
        assert rows == [{'Term': 201601, 'TermDesc': 'Fall 2016', 'Subject': 'CS', 'CourseNumber': '606', 'CRN': '10001', 'Instructor': 'TEST, TEST TEST', 'Grade_A': 202, 'Grade_B': 7, 'Grade_C': 1, 'Grade_DNF': 0, 'Pass': 1, 'NoPass': 0, 'Other': 0, 'Withdraw': 0, 'TOT_NON_W': 100}]
    
    @pytest.fixture
    def fake_peyton_course_data(self):
        try:
            self.conn.execute("""
                INSERT INTO Course_Records
                (Term, TermDesc, Subject, CourseNumber, CRN, Instructor,
                 Grade_A, Grade_B, Grade_C, Grade_DNF,
                 Pass, NoPass, Other, Withdraw, TOT_NON_W)
                VALUES
                (202501, 'Fall 2024', 'TEST_PEYTON', '101', '91111', 'Instructor Peyton One',
                 10, 5, 2, 1, 0, 0, 0, 0, 18),

                (202501, 'Fall 2024', 'TEST_PEYTON', '102', '92222', 'Instructor Peyton Two',
                 8, 4, 3, 2, 0, 0, 0, 0, 17),

                (202501, 'Fall 2024', 'FAKE_PEYTON', '101', '93333', 'Instructor Fake Peyton',
                 1, 1, 1, 1, 0, 0, 0, 0, 4)
            """)

            self.conn.execute("""
                INSERT OR REPLACE INTO Course_Titles
                (Subject, CourseNumber, Title)
                VALUES
                ('TEST_PEYTON', '101', 'Peyton Test Course One'),
                ('TEST_PEYTON', '102', 'Peyton Test Course Two'),
                ('FAKE_PEYTON', '101', 'Peyton Fake Course One')
            """)

            self.conn.commit()
            yield

        finally:
            self.conn.execute("""
                DELETE FROM Course_Records
                WHERE Subject IN ('TEST_PEYTON', 'FAKE_PEYTON')
            """)

            self.conn.execute("""
                DELETE FROM Course_Titles
                WHERE Subject IN ('TEST_PEYTON', 'FAKE_PEYTON')
            """)

            self.conn.commit()

    def test_peyton_grabbing_classes_only_returns_requested_subject(self, fake_peyton_course_data):
        result = asyncio.run(api.get_courses(subject="TEST_PEYTON"))

        codes = [course["code"] for course in result]

        assert "TEST_PEYTON 101" in codes
        assert "TEST_PEYTON 102" in codes
        assert "FAKE_PEYTON 101" not in codes
        assert len(codes) == 2

    def test_peyton_all_relevant_course_data_is_stored(self, fake_peyton_course_data):
        row = self.conn.execute("""
            SELECT *
            FROM Course_Records
            WHERE Subject = 'TEST_PEYTON'
              AND CourseNumber = '101'
        """).fetchone()

        assert row is not None
        assert row["Subject"] == "TEST_PEYTON"
        assert row["CourseNumber"] == "101"
        assert row["CRN"] == "91111"
        assert row["Instructor"] == "Instructor Peyton One"
        assert row["Grade_A"] == 10
        assert row["Grade_B"] == 5
        assert row["Grade_C"] == 2
        assert row["Grade_DNF"] == 1
        assert row["Pass"] == 0
        assert row["NoPass"] == 0
        assert row["Other"] == 0
        assert row["Withdraw"] == 0
        assert row["TOT_NON_W"] == 18

    def test_peyton_course_api_returns_grade_distribution(self, fake_peyton_course_data):
        result = asyncio.run(api.get_courses(subject="TEST_PEYTON"))

        course = next(c for c in result if c["code"] == "TEST_PEYTON 101")

        assert course["name"] == "Peyton Test Course One"
        assert course["avgGpa"] == 3.28

        grade_data = {item["grade"]: item for item in course["gradeData"]}

        assert grade_data["A"]["count"] == 10
        assert grade_data["B"]["count"] == 5
        assert grade_data["C"]["count"] == 2
        assert grade_data["DNF"]["count"] == 1

    def test_peyton_saving_and_retrieving_degree_plan(self):
        group = api.GroupIn(
            major="TEST_PEYTON_MAJOR",
            groupName="Required Peyton Courses",
            type="required",
            sortOrder=0
        )

        group_id = asyncio.run(api.add_group(group, self.PATH))["groupId"]

        requirement = api.RequirementIn(
            major="TEST_PEYTON_MAJOR",
            groupId=group_id,
            subject="TEST_PEYTON",
            courseNumber="101",
            sequenceTag="Year 1 Term 1"
        )

        req_id = asyncio.run(api.add_requirement(requirement, self.PATH))["id"]

        result = asyncio.run(api.get_requirements("TEST_PEYTON_MAJOR", self.PATH))

        assert len(result) == 1
        assert result[0]["groupId"] == group_id
        assert result[0]["groupName"] == "Required Peyton Courses"
        assert result[0]["type"] == "required"
        assert result[0]["sortOrder"] == 0

        courses = result[0]["courses"]

        assert len(courses) == 1
        assert courses[0]["id"] == req_id
        assert courses[0]["code"] == "TEST_PEYTON 101"
        assert courses[0]["sequenceTag"] == "Year 1 Term 1"

        asyncio.run(api.delete_requirement(req_id, self.PATH))
        asyncio.run(api.delete_group(group_id, self.PATH))