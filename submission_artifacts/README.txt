================================================================================
MaxGPA — Degree Planner
CIS 422/522 Software Methodologies — Project 1
Group 7
Authors: Keagan Koski, Hiro Nakae, Peyton Phillips, Robert Mimms
Created: Spring 2026
Last Modified: 2026-05-04
================================================================================

--------------------------------------------------------------------------------
1. DESCRIPTION
--------------------------------------------------------------------------------

MaxGPA is a web application that helps University of Oregon students plan their
degree by identifying which course sections and instructors offer the highest
grade distributions. Students select a major (Computer Science, Mathematics, or
Business Administration), choose a span of academic years, and browse every
required course with its historical grade breakdown (A / B / C / DNF) and a
ranked list of instructors. Students can manually add courses to a plan, or let
the system auto-generate an optimal plan. Completed plans can be saved and
exported to PDF.

An Admin portal allows staff to upload grade-history CSVs, bulk-import degree
requirement plans via CSV, and manually edit requirement groups.

--------------------------------------------------------------------------------
2. AUTHORS (alphabetical by last name)
--------------------------------------------------------------------------------

  [Keagan Last Name]
  Hiro Nakae
  [Peyton Last Name]
  [Robert Last Name]

--------------------------------------------------------------------------------
3. CREATED
--------------------------------------------------------------------------------

  Spring 2026 — CIS 422/522 Software Methodologies, University of Oregon
  Project 1: MaxGPA Degree Planner

--------------------------------------------------------------------------------
4. HOW TO RUN
--------------------------------------------------------------------------------

Prerequisites:
  - Node.js v22+
  - Python 3.14+
  - pip (comes with Python)

Step 1 — Install all dependencies:

  make install

  This runs `npm install` (frontend) and `pip install -r api/requirements.txt`
  (backend). Run from the project root.

Step 2 — Initialize the database:

  make db-init

  Reads all CSV files from data/raw/ and degree plan data from data/meta/ and
  loads them into db/grade_data.db. The database file is included in the
  repository with pre-loaded data, so this step is only needed if you want to
  reset or reload from source CSVs.

Step 3 — Start the backend API:

  make dev-be

  Starts FastAPI at http://localhost:8000 (uses `fastapi dev api/main.py`).
  Keep this terminal open.

Step 4 — Start the frontend (in a separate terminal):

  make dev-fe

  Starts Next.js at http://localhost:3000. Open this URL in a browser.

  The app is now running. Navigate to http://localhost:3000 to use it.

To run all tests:

  make test-fe        # Frontend (Vitest)
  make test-be        # Backend API (Pytest)
  make test-db        # Database (Pytest)

--------------------------------------------------------------------------------
5. ADDITIONAL SETUP
--------------------------------------------------------------------------------

  - No login is required. The app is open to all users.
  - The Admin portal is accessible at http://localhost:3000/admin
  - Grade-history CSVs should be placed in data/raw/ before running db-init.
  - Degree plan CSVs (one per major) can be uploaded via the Admin portal or
    placed in data/meta/major_requirements/ before running db-init.
  - The reconciliation file is at data/meta/Reconciliation.csv. Edit this file
    to add course-number or title normalization rules before re-importing data.

--------------------------------------------------------------------------------
6. SOFTWARE DEPENDENCIES
--------------------------------------------------------------------------------

Frontend:
  - Node.js v22
  - Next.js (see package.json for exact version)
  - React, Tailwind CSS, Recharts, Radix UI, jsPDF, html-to-image, Lucide React
  - Vitest (testing)

Backend:
  - Python 3.14
  - fastapi[standard]
  - pandas
  - pytest

Database:
  - SQLite3 (standard library — no installation required)

--------------------------------------------------------------------------------
7. DIRECTORY STRUCTURE
--------------------------------------------------------------------------------

  /app                  Next.js App Router pages and components
    /admin              Admin portal page (upload CSVs, manage requirements)
    /components         Shared React components (CourseCard, FilterSidebar, etc.)
    /lib                Client-side utilities (saved-plans, requirements logic)
    /saved-plans        Saved degree plans page (view, export PDF)

  /api                  FastAPI backend
    main.py             All API endpoints
    requirements.txt    Python package dependencies

  /db                   Database layer
    database.py         All database functions (init, import, query)
    grade_data.db       SQLite database file (pre-loaded)

  /data
    /raw                Grade-history CSV files from the university
    /meta               Degree plan CSVs and Reconciliation.csv
      /major_requirements   Per-major degree plan CSV files

  /tests
    /api_tests          Pytest tests for FastAPI endpoints
    /app_tests          Vitest tests for React components and utilities
    /db_tests           Pytest tests for database functions

  /backup               Original files preserved before submission rewrites

  Makefile              Shortcut commands (install, dev, test, db-init)
  README.txt            This file
  ARCHITECTURE.md       System architecture and UML diagrams
  DOCUMENTATION.md      Developer session log and design decisions
  Functional_Requirements.md  CIS 422 functional requirements (v3)

--------------------------------------------------------------------------------
AI DISCLOSURE
--------------------------------------------------------------------------------

The development of MaxGPA made extensive use of AI language models (including
Claude by Anthropic and others) throughout every phase of the software
engineering process: requirements analysis, software design, implementation,
testing, debugging, and documentation. All AI-generated output was reviewed,
evaluated, and integrated by the team members listed above, who remain
responsible for the final product.

================================================================================
