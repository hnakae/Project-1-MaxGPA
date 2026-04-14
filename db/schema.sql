-- db/schema.sql (robert)

-- Enable foreign keys for data integrity
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS terms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, -- e.g., "Fall 2025"
    is_completed BOOLEAN DEFAULT 0
);

CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    term_id INTEGER NOT NULL,
    name TEXT NOT NULL,         -- e.g., "CS 422"
    credits INTEGER NOT NULL,    -- e.g., 4
    grade_point REAL,           -- e.g., 4.0 for A, 3.7 for A-
    letter_grade TEXT,          -- e.g., "A"
    FOREIGN KEY (term_id) REFERENCES terms(id) ON DELETE CASCADE
);