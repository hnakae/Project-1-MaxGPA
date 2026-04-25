# Project Architecture

This project follows a decoupled architecture with a Next.js frontend, a FastAPI backend, and a SQLite3 database.

## High-Level Data Flow
`Next.js (App) <-> Server Actions/API Route <-> FastAPI (API) <-> SQLite3 (DB)`

---

## 1. Database Layer (SQLite3)
- **File:** `db/maxgpa.db` (Initialized via `db/database.py`)
- **Responsibility:** Stores historical grade data, major requirements, and course reconciliation maps.
- **Data Ingestion:** Raw CSV files are processed using Pandas. During this phase, grade variants (e.g., A+, A, A-) are aggregated into canonical buckets (`Grade_A`, `Grade_B`, etc.).
- **Key Tables:**
    - `Course_Records`: Aggregated counts of grades per term/instructor/course.
    - `Major_Requirements`: Links courses to specific majors/years.
    - `Reconciliation`: Maps inconsistent course titles/numbers to canonical names.

- The Standard Structure:
  - Ideally, your project should look like this:

   1 /data          <-- Raw, immutable "source of truth" files
   2   /raw         (e.g., your large CSVs)
   3   /meta        (e.g., Reconciliation.csv, degree_plans/)
   4 /db            <-- Database logic and the database file itself
   5   database.py  (the code that builds the DB)
   6   maxgpa.db    (the generated database)

## 2. API Layer (FastAPI)
- **File:** `api/main.py`
- **Responsibility:** Provides RESTful endpoints for the frontend. It handles the transition from database rows to visualizable JSON data.
- **Example Endpoint:** `GET /api/stats/course/{course_code}`
- **JSON Response Example:**
  ```json
  {
    "labels": ["A", "B", "C", "DNF"],
    "data": [145, 68, 23, 12]
  }
  ```
  *Note: DNF (Did Not Pass) includes D+, D, D-, F, and N grades.*

## 3. Frontend Layer (Next.js)
- **Framework:** Next.js 15 (App Router)
- **Server-Side Communication:**
    - **Server Actions (`app/actions.ts`):** Used for direct data fetching during server-side rendering or in response to user actions.
    - **API Routes (`app/stats/route.ts`):** Acts as a proxy to the FastAPI backend.
- **Client-Side UI:**
    - **Dashboard (`app/dashboard/page.tsx`):** Manages state for filters (Major, Year, Instructor).
    - **Components:** `CourseCard` displays high-level stats and embeds `GradeChart` (using Chart.js/Recharts) to visualize the distribution JSON.

---

## Overlap & Integration Points
- **Data Aggregation:** Logic for "Stripping + and -" happens at the **Database/Ingestion** level in `db/database.py` to ensure high performance.
- **Filtering:** Initial filtering (by Course/Major) happens in the **API/Database**, while secondary filtering (by local search/UI toggles) happens in the **Frontend**.
- **Environment:** The frontend communicates with the backend via `BACKEND_URL` (defaulting to `http://127.0.0.1:8000`).

---

## 4. Testing Strategy
- **Frontend (Vitest):** Tests are located in `tests/frontend/`.
    - **Unit Tests:** Validate individual components and utility functions.
    - **Server Action Tests:** Mock the `fetch` API to verify communication between Next.js and FastAPI without requiring a running backend.
- **Backend:** (Placeholder for FastAPI testing strategy, typically using `pytest` and `httpx.AsyncClient`).

