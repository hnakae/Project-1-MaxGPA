import pytest
import sys
import os
import asyncio

parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
sys.path.append(parent_dir)

import api.main as api

# API TESTS
class TestAPI:
    tmp_id = 0
    conn = api.get_db()

    def test_add_group(self):
        group = api.GroupIn(major = "TEST", groupName = "TEST_GROUP", type = "TEST_TYPE", sortOrder = 0)
        TestAPI.tmp_id = asyncio.run(api.add_group(group))["groupId"]
        cur = TestAPI.conn.execute("SELECT * FROM Requirement_Groups WHERE GroupID = ?", (TestAPI.tmp_id,)).fetchall()
        assert [dict(row) for row in cur] == [{'GroupID': TestAPI.tmp_id, 'Major': 'TEST', 'GroupName': 'TEST_GROUP', 'Type': 'TEST_TYPE', 'SortOrder': 0}]

    def test_delete_group(self):
        cur = TestAPI.conn.execute("SELECT * FROM Requirement_Groups WHERE GroupID = ?", (TestAPI.tmp_id,)).fetchall()
        assert [dict(row) for row in cur] == [{'GroupID': TestAPI.tmp_id, 'Major': 'TEST', 'GroupName': 'TEST_GROUP', 'Type': 'TEST_TYPE', 'SortOrder': 0}]
        asyncio.run(api.delete_group(TestAPI.tmp_id))
        cur = TestAPI.conn.execute("SELECT * FROM Requirement_Groups WHERE GroupID = ?", (TestAPI.tmp_id,)).fetchall()
        assert [dict(row) for row in cur] == []

    def test_add_requirement(self):
        requirement = api.RequirementIn(major = "TEST", groupId = -1, subject = "TEST", courseNumber = "000")
        TestAPI.tmp_id = asyncio.run(api.add_requirement(requirement))["id"]
        cur = TestAPI.conn.execute("SELECT * FROM Major_Requirements WHERE ReqID = ?", (TestAPI.tmp_id,)).fetchall()
        assert [dict(row) for row in cur] == [{'ReqID': TestAPI.tmp_id, 'GroupID': -1, 'Major': 'TEST', 'Subject': 'TEST', 'CourseNumber': '000', 'SequenceTag': None}]

    def test_delete_requirement(self):
        cur = TestAPI.conn.execute("SELECT * FROM Major_Requirements WHERE ReqID = ?", (TestAPI.tmp_id,)).fetchall()
        assert [dict(row) for row in cur] == [{'ReqID': TestAPI.tmp_id, 'GroupID': -1, 'Major': 'TEST', 'Subject': 'TEST', 'CourseNumber': '000', 'SequenceTag': None}]
        asyncio.run(api.delete_requirement(TestAPI.tmp_id))
        cur = TestAPI.conn.execute("SELECT * FROM Major_Requirements WHERE ReqID = ?", (TestAPI.tmp_id,)).fetchall()
        assert [dict(row) for row in cur] == []
