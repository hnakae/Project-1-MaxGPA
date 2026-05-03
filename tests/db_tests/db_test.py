import io
import sqlite3
import pytest

import db.database as db_module
from db.database import import_grade_csv, _load_major_requirements

MINIMAL_CSV_HEADER = (
    "TERM,TERM_DESC,SUBJ,NUMB,CRN,INSTRUCTOR,"
    "AP,A,AM,BP,B,BM,CP,C,CM,DP,D,DM,F,P,N,OTHER,W,TOT_NON_W\n"
)


def _make_csv_row(
    term=202501, subj="CS", numb="101", crn="99999", instructor="Smith",
    ap=10, a=20, am=5, bp=8, b=15, bm=3, cp=4, c=6, cm=1,
    dp=1, d=1, dm=0, f=2, p=0, n=0, other=0, w=1, tot=77,
):
    return (
        f"{term},Spring 2025,{subj},{numb},{crn},{instructor},"
        f"{ap},{a},{am},{bp},{b},{bm},{cp},{c},{cm},"
        f"{dp},{d},{dm},{f},{p},{n},{other},{w},{tot}\n"
    )


def _csv_bytes(*rows):
    return (MINIMAL_CSV_HEADER + "".join(rows)).encode()


@pytest.fixture()
def tmp_db(tmp_path, monkeypatch):
    db_path = str(tmp_path / "test.db")
    monkeypatch.setattr(db_module, "DB_FILE", db_path)
    conn = sqlite3.connect(db_path)
    conn.executescript('''
        CREATE TABLE Course_Records (
            RecordID     INTEGER PRIMARY KEY AUTOINCREMENT,
            Term         INTEGER,
            TermDesc     TEXT,
            Subject      TEXT,
            CourseNumber TEXT,
            CRN          TEXT,
            Instructor   TEXT,
            Grade_A      INTEGER DEFAULT 0,
            Grade_B      INTEGER DEFAULT 0,
            Grade_C      INTEGER DEFAULT 0,
            Grade_DNF    INTEGER DEFAULT 0,
            Pass         INTEGER DEFAULT 0,
            NoPass       INTEGER DEFAULT 0,
            Other        INTEGER DEFAULT 0,
            Withdraw     INTEGER DEFAULT 0,
            TOT_NON_W    INTEGER DEFAULT 0
        );
    ''')
    conn.commit()
    conn.close()
    return db_path


class TestImportGradeCsv:
    def test_inserts_new_term(self, tmp_db):
        result = import_grade_csv(_csv_bytes(_make_csv_row(term=202501)))
        assert result["rows_inserted"] == 1
        assert 202501 in result["new_terms"]
        assert result["updated_terms"] == []

    def test_accepts_bytes(self, tmp_db):
        result = import_grade_csv(_csv_bytes(_make_csv_row(term=202502)))
        assert result["rows_inserted"] == 1

    def test_accepts_file_like(self, tmp_db):
        buf = io.BytesIO(_csv_bytes(_make_csv_row(term=202503)))
        result = import_grade_csv(buf)
        assert result["rows_inserted"] == 1

    def test_replaces_existing_term(self, tmp_db):
        import_grade_csv(_csv_bytes(_make_csv_row(term=202501, a=10)))
        result = import_grade_csv(_csv_bytes(_make_csv_row(term=202501, a=99)))

        assert result["updated_terms"] == [202501]
        assert result["new_terms"] == []

        conn = sqlite3.connect(tmp_db)
        row = conn.execute(
            "SELECT Grade_A FROM Course_Records WHERE Term = 202501"
        ).fetchone()
        conn.close()
        # ap=10 + a=99 + am=5 = 114
        assert row[0] == 114

    def test_redacted_rows_dropped(self, tmp_db):
        redacted = "202501,Spring 2025,CS,101,1,Smith," + ",".join(["*"] * 17) + ",5\n"
        result = import_grade_csv(_csv_bytes(redacted))
        assert result["rows_inserted"] == 0

    def test_multiple_terms_split_correctly(self, tmp_db):
        import_grade_csv(_csv_bytes(_make_csv_row(term=202401)))
        result = import_grade_csv(
            _csv_bytes(_make_csv_row(term=202401), _make_csv_row(term=202501))
        )
        assert 202401 in result["updated_terms"]
        assert 202501 in result["new_terms"]


# ── Helpers ────────────────────────────────────────────────────────────────────

def _req_csv(*rows):
    header = "GROUP,GROUP_TYPE,SUBJ,NUMB,TITLE,SEQ\n"
    return header + "".join(rows)


def _row(group="Core", group_type="all", subj="CS", numb="210", title="", seq=""):
    return f"{group},{group_type},{subj},{numb},{title},{seq}\n"


@pytest.fixture()
def tmp_req_db(tmp_path, monkeypatch):
    db_path = str(tmp_path / "test_req.db")
    monkeypatch.setattr(db_module, "DB_FILE", db_path)
    conn = sqlite3.connect(db_path)
    conn.executescript('''
        CREATE TABLE Requirement_Groups (
            GroupID   INTEGER PRIMARY KEY AUTOINCREMENT,
            Major     TEXT NOT NULL,
            GroupName TEXT NOT NULL,
            Type      TEXT NOT NULL DEFAULT 'all',
            SortOrder INTEGER DEFAULT 0
        );
        CREATE TABLE Major_Requirements (
            ReqID        INTEGER PRIMARY KEY AUTOINCREMENT,
            GroupID      INTEGER NOT NULL,
            Major        TEXT NOT NULL,
            Subject      TEXT NOT NULL,
            CourseNumber TEXT NOT NULL,
            SequenceTag  TEXT,
            UNIQUE(GroupID, Subject, CourseNumber),
            FOREIGN KEY(GroupID) REFERENCES Requirement_Groups(GroupID)
        );
        CREATE TABLE CourseTitles (
            Subject      TEXT NOT NULL,
            CourseNumber TEXT NOT NULL,
            Title        TEXT NOT NULL,
            PRIMARY KEY (Subject, CourseNumber)
        );
    ''')
    conn.commit()
    conn.close()
    return db_path


# ── Tests ──────────────────────────────────────────────────────────────────────

class TestLoadDegreePlans:
    def _run(self, db_path, plans_dir, monkeypatch):
        monkeypatch.setattr(db_module, "MAJOR_REQUIREMENTS_DIR", str(plans_dir))
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        _load_major_requirements(conn, cursor)
        conn.close()

    def test_creates_groups_and_requirements(self, tmp_req_db, tmp_path, monkeypatch):
        (tmp_path / "CS.csv").write_text(
            _req_csv(
                _row("Core", "all", "CS", "210", "CS I"),
                _row("Core", "all", "CS", "211", "CS II"),
                _row("Electives", "choose_from", "CS", "432", "Theory"),
            )
        )
        self._run(tmp_req_db, tmp_path, monkeypatch)

        conn = sqlite3.connect(tmp_req_db)
        groups = conn.execute(
            "SELECT Major, GroupName, Type FROM Requirement_Groups ORDER BY SortOrder"
        ).fetchall()
        reqs = conn.execute(
            "SELECT Subject, CourseNumber FROM Major_Requirements ORDER BY ReqID"
        ).fetchall()
        conn.close()

        assert groups == [("CS", "Core", "all"), ("CS", "Electives", "choose_from")]
        assert reqs == [("CS", "210"), ("CS", "211"), ("CS", "432")]

    def test_filename_becomes_major_key(self, tmp_req_db, tmp_path, monkeypatch):
        (tmp_path / "MATH.csv").write_text(_req_csv(_row("Core", "all", "MATH", "251Z")))
        self._run(tmp_req_db, tmp_path, monkeypatch)

        conn = sqlite3.connect(tmp_req_db)
        major = conn.execute("SELECT Major FROM Requirement_Groups").fetchone()[0]
        req_major = conn.execute("SELECT Major FROM Major_Requirements").fetchone()[0]
        conn.close()

        assert major == "MATH"
        assert req_major == "MATH"

    def test_sort_order_follows_first_appearance(self, tmp_req_db, tmp_path, monkeypatch):
        (tmp_path / "CS.csv").write_text(
            _req_csv(
                _row("Gamma", "all", "CS", "300"),
                _row("Alpha", "all", "CS", "400"),
                _row("Beta",  "all", "CS", "500"),
            )
        )
        self._run(tmp_req_db, tmp_path, monkeypatch)

        conn = sqlite3.connect(tmp_req_db)
        names = [r[0] for r in conn.execute(
            "SELECT GroupName FROM Requirement_Groups ORDER BY SortOrder"
        ).fetchall()]
        conn.close()

        assert names == ["Gamma", "Alpha", "Beta"]

    def test_seq_tag_stored(self, tmp_req_db, tmp_path, monkeypatch):
        (tmp_path / "CS.csv").write_text(
            _req_csv(
                _row("Seq Group", "one_sequence", "CS", "210", seq="A"),
                _row("Seq Group", "one_sequence", "CS", "211", seq="A"),
                _row("Seq Group", "one_sequence", "CS", "310", seq="B"),
            )
        )
        self._run(tmp_req_db, tmp_path, monkeypatch)

        conn = sqlite3.connect(tmp_req_db)
        tags = [r[0] for r in conn.execute(
            "SELECT SequenceTag FROM Major_Requirements ORDER BY ReqID"
        ).fetchall()]
        conn.close()

        assert tags == ["A", "A", "B"]

    def test_title_upserts_course_titles(self, tmp_req_db, tmp_path, monkeypatch):
        (tmp_path / "CS.csv").write_text(
            _req_csv(_row("Core", "all", "CS", "210", title="Computer Science I"))
        )
        self._run(tmp_req_db, tmp_path, monkeypatch)

        conn = sqlite3.connect(tmp_req_db)
        title = conn.execute(
            "SELECT Title FROM CourseTitles WHERE Subject='CS' AND CourseNumber='210'"
        ).fetchone()
        conn.close()

        assert title is not None
        assert title[0] == "Computer Science I"

    def test_blank_title_skips_course_titles(self, tmp_req_db, tmp_path, monkeypatch):
        (tmp_path / "CS.csv").write_text(_req_csv(_row("Core", "all", "CS", "210", title="")))
        self._run(tmp_req_db, tmp_path, monkeypatch)

        conn = sqlite3.connect(tmp_req_db)
        row = conn.execute("SELECT * FROM CourseTitles").fetchone()
        conn.close()

        assert row is None

    def test_reload_clears_and_reinserts(self, tmp_req_db, tmp_path, monkeypatch):
        csv_path = tmp_path / "CS.csv"
        csv_path.write_text(_req_csv(_row("Core", "all", "CS", "210")))
        self._run(tmp_req_db, tmp_path, monkeypatch)

        # Rewrite with a different course and reload
        csv_path.write_text(_req_csv(_row("Core", "all", "CS", "999")))
        self._run(tmp_req_db, tmp_path, monkeypatch)

        conn = sqlite3.connect(tmp_req_db)
        reqs = conn.execute("SELECT CourseNumber FROM Major_Requirements").fetchall()
        groups = conn.execute("SELECT COUNT(*) FROM Requirement_Groups").fetchone()[0]
        conn.close()

        assert reqs == [("999",)]
        assert groups == 1

    def test_skips_rows_without_subj_or_numb(self, tmp_req_db, tmp_path, monkeypatch):
        (tmp_path / "CS.csv").write_text(
            _req_csv(
                "Core,all,,,No Course Here,\n",
                _row("Core", "all", "CS", "210"),
            )
        )
        self._run(tmp_req_db, tmp_path, monkeypatch)

        conn = sqlite3.connect(tmp_req_db)
        count = conn.execute("SELECT COUNT(*) FROM Major_Requirements").fetchone()[0]
        conn.close()

        assert count == 1

    def test_multiple_csv_files_load_independently(self, tmp_req_db, tmp_path, monkeypatch):
        (tmp_path / "CS.csv").write_text(_req_csv(_row("Core", "all", "CS", "210")))
        (tmp_path / "MATH.csv").write_text(_req_csv(_row("Core", "all", "MATH", "251Z")))
        self._run(tmp_req_db, tmp_path, monkeypatch)

        conn = sqlite3.connect(tmp_req_db)
        majors = {r[0] for r in conn.execute("SELECT DISTINCT Major FROM Requirement_Groups").fetchall()}
        conn.close()

        assert majors == {"CS", "MATH"}

    def test_missing_directory_does_not_raise(self, tmp_req_db, tmp_path, monkeypatch):
        monkeypatch.setattr(db_module, "MAJOR_REQUIREMENTS_DIR", str(tmp_path / "nonexistent"))
        conn = sqlite3.connect(tmp_req_db)
        cursor = conn.cursor()
        _load_major_requirements(conn, cursor)  # should not raise
        conn.close()
