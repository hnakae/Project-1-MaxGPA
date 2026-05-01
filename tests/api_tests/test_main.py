import pytest
import sys
import os
import asyncio
import shutil
import sqlite3

parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
sys.path.append(parent_dir)

import api.main as api



# API TESTS
class TestAPI:
    @classmethod
    def setup_class(cls):
        cls.conn = sqlite3.connect("db/test_data.db")
        cls.conn.row_factory = sqlite3.Row
        cls.PATH = os.path.join(parent_dir, "db", "test_data.db")

    @pytest.fixture(scope="class", autouse=True)
    def setup_cleanup(self):
        # Setup
        shutil.copy("db/grade_data.db", "db/test_data.db")

        # Run tests
        yield
    
        # Cleanup
        self.conn.close()
        os.remove("db/test_data.db")

    def test_add_deleete_group(self):
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


