# SQLite3 connection (robert)

import sqlite3
import pandas as pd
import os
import glob

DB_FILE = 'db/grade_data.db'
CSV_FILE = 'data/raw/pub_rec_master_f2015-u2025.csv'
DEGREE_PLANS_DIR = 'data/meta/degree_plans'
RECONCILIATION_FILE = 'data/meta/Reconciliation.csv'

# All columns that carry grade counts (TOT_NON_W is enrollment, not a grade)
GRADE_COLS = [
    'AP', 'A', 'AM', 'BP', 'B', 'BM', 'CP', 'C', 'CM',
    'DP', 'D', 'DM', 'F', 'P', 'N', 'OTHER', 'W',
]


def clean_and_aggregate_data(df):
    """
    Drops fully-redacted rows (all grade cols = '*'), casts grade counts to int,
    and aggregates +/- variants into letter-grade buckets.
    """
    print("Cleaning data and aggregating grades...")

    df.columns = df.columns.str.strip()

    # Confirmed from data inspection: rows are either fully redacted (all '*') or
    # fully numeric — no mixed rows exist. Dropping on any '*' is safe and correct.
    mask = df[GRADE_COLS].isin(['*']).any(axis=1)
    df = df[~mask].copy()
    print(f"  Dropped {mask.sum():,} redacted rows, {len(df):,} remain.")

    for col in GRADE_COLS + ['TOT_NON_W']:
        df[col] = pd.to_numeric(df[col].fillna(0), errors='coerce').fillna(0).astype(int)

    # TERM is a numeric code (e.g. 201501); cast so API can filter with List[int]
    df['TERM'] = pd.to_numeric(df['TERM'], errors='coerce').fillna(0).astype(int)

    df['Grade_A'] = df['AP'] + df['A'] + df['AM']
    df['Grade_B'] = df['BP'] + df['B'] + df['BM']
    df['Grade_C'] = df['CP'] + df['C'] + df['CM']
    df['Grade_D'] = df['DP'] + df['D'] + df['DM']
    # DNF (Did Not Pass) = D+/D/D-/F/N per project spec
    df['Grade_DNF'] = df['DP'] + df['D'] + df['DM'] + df['F'] + df['N']

    df = df.rename(columns={
        'F':          'Grade_F',
        'P':          'Pass',
        'N':          'NoPass',
        'W':          'Withdraw',
        'OTHER':      'Other',
        'TERM':       'Term',
        'TERM_DESC':  'TermDesc',
        'SUBJ':       'Subject',
        'NUMB':       'CourseNumber',
        'INSTRUCTOR': 'Instructor',
    })

    # NUMB stays TEXT — course numbers like '352H' (honors) are common in this dataset
    columns_to_keep = [
        'Term', 'TermDesc', 'Subject', 'CourseNumber', 'CRN', 'Instructor',
        'Grade_A', 'Grade_B', 'Grade_C', 'Grade_DNF',
        'Pass', 'NoPass', 'Other', 'Withdraw', 'TOT_NON_W',
    ]
    return df[columns_to_keep]


def _setup_schema(cursor):
    cursor.executescript('''
        CREATE TABLE IF NOT EXISTS Majors (
            MajorID   INTEGER PRIMARY KEY AUTOINCREMENT,
            MajorName TEXT UNIQUE NOT NULL
        );

        -- Year/Term are the student's year-in-program and quarter (1=Fall,2=Winter,3=Spring)
        CREATE TABLE IF NOT EXISTS Major_Requirements (
            ReqID        INTEGER PRIMARY KEY AUTOINCREMENT,
            MajorID      INTEGER NOT NULL,
            Year         INTEGER,
            Term         INTEGER,
            Subject      TEXT NOT NULL,
            CourseNumber TEXT NOT NULL,
            Title        TEXT,
            FOREIGN KEY(MajorID) REFERENCES Majors(MajorID)
        );

        -- Maps title/number variants in grade history to canonical degree-plan names
        CREATE TABLE IF NOT EXISTS Reconciliation (
            RecID      INTEGER PRIMARY KEY AUTOINCREMENT,
            ChangeFrom TEXT NOT NULL,
            ChangeTo   TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS Course_Records (
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


def _create_indexes(cursor):
    """
    Indexes for the three API query patterns:
      class_grades       -> CourseNumber + Term
      major_grades       -> Subject + Term (joined via Major_Requirements)
      instructor_grades  -> Instructor + Subject + Term
    """
    cursor.executescript('''
        CREATE INDEX IF NOT EXISTS idx_cr_subject_course
            ON Course_Records(Subject, CourseNumber);
        CREATE INDEX IF NOT EXISTS idx_cr_term
            ON Course_Records(Term);
        CREATE INDEX IF NOT EXISTS idx_cr_instructor_subject
            ON Course_Records(Instructor, Subject);
        CREATE INDEX IF NOT EXISTS idx_cr_subject_term
            ON Course_Records(Subject, Term);
        CREATE INDEX IF NOT EXISTS idx_mr_major
            ON Major_Requirements(MajorID);
        CREATE INDEX IF NOT EXISTS idx_mr_subject_course
            ON Major_Requirements(Subject, CourseNumber);
    ''')


DATA_DIR = os.path.dirname(CSV_FILE)
_NON_GRADE_CSVS = {os.path.basename(RECONCILIATION_FILE).lower()}


def _load_grade_history(conn, data_dir=DATA_DIR):
    csv_files = sorted(
        f for f in glob.glob(os.path.join(data_dir, '*.[Cc][Ss][Vv]'))
        if os.path.basename(f).lower() not in _NON_GRADE_CSVS
    )
    if not csv_files:
        print(f"Warning: no grade CSVs found in '{data_dir}' — Course_Records will be empty.")
        return

    existing_terms = pd.read_sql('SELECT DISTINCT Term FROM Course_Records', conn)['Term'].tolist()

    for csv_file in csv_files:
        print(f"Reading {csv_file}...")
        df = pd.read_csv(csv_file, dtype=str)
        cleaned_df = clean_and_aggregate_data(df)

        # Skip terms already loaded so re-running or appending a new CSV is safe
        new_rows = cleaned_df[~cleaned_df['Term'].isin(existing_terms)]
        if new_rows.empty:
            print(f"  No new terms in {os.path.basename(csv_file)} — skipping.")
            continue

        new_terms = sorted(new_rows['Term'].unique().tolist())
        print(f"  Inserting {len(new_rows):,} records for {len(new_terms)} new term(s): {new_terms[:5]}{'...' if len(new_terms) > 5 else ''}")
        new_rows.to_sql('Course_Records', conn, if_exists='append', index=False, chunksize=2000)
        conn.commit()
        existing_terms.extend(new_terms)

    print(f"Course_Records now contains {len(existing_terms)} term(s).")


def _load_degree_plans(conn, cursor):
    if not os.path.isdir(DEGREE_PLANS_DIR):
        print(f"No degree plans directory at '{DEGREE_PLANS_DIR}' — skipping.")
        return

    plan_files = glob.glob(os.path.join(DEGREE_PLANS_DIR, '*.[Cc][Ss][Vv]'))
    if not plan_files:
        print(f"No degree plan CSVs found in '{DEGREE_PLANS_DIR}' — skipping.")
        return

    for plan_file in sorted(plan_files):
        # Filename convention: Computer_Science_BA.csv -> "Computer Science BA"
        major_name = os.path.splitext(os.path.basename(plan_file))[0].replace('_', ' ')
        print(f"Loading degree plan: {major_name}")

        cursor.execute('INSERT OR IGNORE INTO Majors (MajorName) VALUES (?)', (major_name,))
        cursor.execute('SELECT MajorID FROM Majors WHERE MajorName = ?', (major_name,))
        major_id = cursor.fetchone()[0]

        # Full reload: clear existing requirements for this major then re-insert
        cursor.execute('DELETE FROM Major_Requirements WHERE MajorID = ?', (major_id,))

        df = pd.read_csv(plan_file, dtype=str)
        df.columns = df.columns.str.strip()

        rows = [
            (
                major_id,
                row.get('YEAR', '').strip() or None,
                row.get('TERM', '').strip() or None,
                row.get('SUBJ', '').strip(),
                row.get('NUMB', '').strip(),
                row.get('TITLE', '').strip() or None,
            )
            for _, row in df.iterrows()
            if row.get('SUBJ', '').strip() and row.get('NUMB', '').strip()
        ]
        cursor.executemany('''
            INSERT INTO Major_Requirements (MajorID, Year, Term, Subject, CourseNumber, Title)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', rows)
        print(f"  Inserted {len(rows)} requirements for {major_name}.")

    conn.commit()


def _load_reconciliation(conn, cursor):
    if not os.path.exists(RECONCILIATION_FILE):
        print(f"No reconciliation file at '{RECONCILIATION_FILE}' — skipping.")
        return

    print(f"Loading reconciliation mappings from {RECONCILIATION_FILE}...")
    df = pd.read_csv(RECONCILIATION_FILE, dtype=str)
    df.columns = df.columns.str.strip()

    cursor.execute('DELETE FROM Reconciliation')
    rows = [
        (row['CHANGE_FROM'].strip(), row['TO'].strip())
        for _, row in df.iterrows()
        if row.get('CHANGE_FROM', '').strip() and row.get('TO', '').strip()
    ]
    cursor.executemany('INSERT INTO Reconciliation (ChangeFrom, ChangeTo) VALUES (?, ?)', rows)
    conn.commit()
    print(f"Loaded {len(rows)} reconciliation mappings.")


def initialize_database(data_dir=DATA_DIR):
    os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)

    print(f"Connecting to database: {DB_FILE}")
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    cursor.execute('PRAGMA journal_mode=WAL')
    cursor.execute('PRAGMA foreign_keys=ON')

    print("Setting up schema...")
    _setup_schema(cursor)
    conn.commit()

    _load_grade_history(conn, data_dir)
    _load_degree_plans(conn, cursor)
    _load_reconciliation(conn, cursor)

    print("Creating indexes...")
    _create_indexes(cursor)
    conn.commit()

    conn.close()
    print("Database initialization complete.")


if __name__ == '__main__':
    import sys
    initialize_database(sys.argv[1] if len(sys.argv) > 1 else DATA_DIR)
