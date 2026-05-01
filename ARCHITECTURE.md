# MaxGPA — Architecture & UML Diagrams

Three-layer architecture: **SQLite database** ← **FastAPI backend** ← **Next.js frontend**.

```
Browser  ──►  Next.js (port 3000)  ──►  FastAPI (port 8000)  ──►  SQLite (grade_data.db)
```

All data fetching is client-side `fetch()` from `"use client"` components — the browser calls FastAPI directly. This works for local demo use; for production deployment FastAPI would need to be reachable from the internet or server actions would be used instead.

---

## Layer 1 — Database (SQLite)

The database has three distinct concerns stored in one file (`db/grade_data.db`):
- **Grade history** — imported from raw CSV files at startup (`Course_Records`, `CourseTitles`, `Reconciliation`)
- **Student planning** — lightweight runtime tables (`terms`, `courses`)
- **Degree requirements** — managed via admin UI (`Requirement_Groups`, `Major_Requirements`)

### 1a. Entity-Relationship Diagram (static)

```mermaid
erDiagram
    TERMS {
        int id PK
        text name
        boolean is_completed
    }
    COURSES {
        int id PK
        int term_id FK
        text name
        int credits
        real grade_point
        text letter_grade
    }
    COURSE_RECORDS {
        int RecordID PK
        int Term
        text TermDesc
        text Subject
        text CourseNumber
        text CRN
        text Instructor
        int Grade_A
        int Grade_B
        int Grade_C
        int Grade_DNF
        int Pass
        int NoPass
        int Other
        int Withdraw
        int TOT_NON_W
    }
    COURSE_TITLES {
        text Subject PK
        text CourseNumber PK
        text Title
    }
    REQUIREMENT_GROUPS {
        int GroupID PK
        text Major
        text GroupName
        text Type
        int SortOrder
    }
    MAJOR_REQUIREMENTS {
        int ReqID PK
        int GroupID FK
        text Major
        text Subject
        text CourseNumber
        text SequenceTag
    }
    RECONCILIATION {
        int RecID PK
        text ChangeFrom
        text ChangeTo
    }

    TERMS ||--o{ COURSES : "has"
    REQUIREMENT_GROUPS ||--o{ MAJOR_REQUIREMENTS : "contains"
    COURSE_RECORDS }o--o| COURSE_TITLES : "described by (Subject + CourseNumber)"
    COURSE_RECORDS }o--o| RECONCILIATION : "normalized by (ChangeFrom)"
```

### 1b. Database Initialization Sequence (dynamic)

How raw CSV data is loaded into SQLite at startup via `db/database.py`.

```mermaid
sequenceDiagram
    participant App as database.py
    participant CSV as data/raw/*.csv
    participant DB as SQLite (grade_data.db)

    App->>DB: CREATE tables if not exists (all 7 tables)
    App->>DB: CREATE indexes (Subject, CourseNumber, Term, Instructor)
    App->>CSV: read pub_rec_master_f2015-u2025.csv
    App->>CSV: read pub_rec_master_w2016-f2025.csv
    loop For each CSV row
        App->>App: strip A+/A/A- → Grade_A bucket
        App->>App: strip B+/B/B- → Grade_B bucket
        App->>App: strip C+/C/C- → Grade_C bucket
        App->>App: strip D+/D/D-/F/N → Grade_DNF bucket
        App->>App: skip if term already loaded
        App->>DB: INSERT INTO Course_Records (aggregated row)
        App->>DB: INSERT OR IGNORE INTO CourseTitles (Subject, CourseNumber, Title)
    end
    App->>CSV: read data/meta/Reconciliation.csv
    App->>DB: INSERT INTO Reconciliation (ChangeFrom, ChangeTo)
    App->>DB: PRAGMA journal_mode=WAL
    App->>DB: PRAGMA foreign_keys=ON
```

---

## Layer 2 — API (FastAPI)

`api/main.py` exposes 11 async endpoints. All queries use parameterized SQL directly against SQLite — no ORM.

### 2a. Endpoint Map (static)

```mermaid
graph TD
    API[FastAPI app<br/>api/main.py]

    API --> RG[Requirement Management]
    RG --> RG1["GET /api/requirements?major="]
    RG --> RG2["POST /api/requirement-groups"]
    RG --> RG3["DELETE /api/requirement-groups/{group_id}"]
    RG --> RG4["POST /api/requirements"]
    RG --> RG5["DELETE /api/requirements/{req_id}"]

    API --> CD[Course Data]
    CD --> CD1["GET /api/courses?subjects=&years=&search=&instructor="]
    CD --> CD2["GET /api/subjects"]
    CD --> CD3["GET /api/academic-years"]

    API --> IA[Instructor Analytics]
    IA --> IA1["GET /api/course-instructors?code=&limit="]
    IA --> IA2["GET /api/bulk-best-instructors?codes="]
    IA --> IA3["GET /api/instructors?subject="]
```

### 2b. Data Model Class Diagram (static)

Request bodies (Pydantic) and response shapes used across the API.

```mermaid
classDiagram
    class GroupIn {
        +str major
        +str groupName
        +str type
        +int sortOrder
    }

    class RequirementIn {
        +str major
        +int groupId
        +str subject
        +str courseNumber
        +Optional~str~ sequenceTag
    }

    class RequirementGroup {
        +int groupId
        +str groupName
        +str type
        +int sortOrder
        +list~RequirementCourse~ courses
    }

    class RequirementCourse {
        +int id
        +str code
        +str name
        +str sequenceTag
    }

    class CourseResult {
        +str code
        +str name
        +float avgGpa
        +list~GradeEntry~ gradeData
    }

    class InstructorResult {
        +str instructor
        +float avgGpa
        +list~GradeEntry~ gradeData
    }

    class GradeEntry {
        +str grade
        +int count
        +float percentage
    }

    RequirementGroup "1" --> "many" RequirementCourse
    CourseResult "1" --> "many" GradeEntry
    InstructorResult "1" --> "many" GradeEntry
```

### 2c. "Get Courses" Request Sequence (dynamic)

Full lifecycle of a `GET /api/courses` call — the most complex query in the system.

```mermaid
sequenceDiagram
    participant Browser
    participant API as FastAPI
    participant DB as SQLite

    Browser->>API: GET /api/courses?subjects=CS,MATH&years=AY24,AY25
    API->>API: parse subjects → ["CS","MATH"]
    API->>API: parse years → academic year → term codes
    API->>DB: SELECT Subject, CourseNumber, Title,<br/>SUM(Grade_A), SUM(Grade_B), SUM(Grade_C), SUM(Grade_DNF)<br/>FROM Course_Records JOIN CourseTitles<br/>WHERE Subject IN (?) AND Term IN (?) LIMIT 500
    DB->>API: raw rows (subject, course#, grade counts)
    API->>API: avgGpa = (A×4 + B×3 + C×2) / total
    API->>API: compute grade percentages per bucket
    API->>Browser: JSON array of CourseResult
```

---

## Layer 3 — Next.js App

Three pages under `app/` using the App Router. All data fetching is client-side `fetch()`.

### 3a. Component Hierarchy (static)

```mermaid
graph TD
    AL[AppLayout<br/>app-layout.tsx]
    AL --> Header
    Header --> Logo
    Header --> NavLinks["NavLinks<br/>Degree Planner · Admin · My Plans"]
    Header --> UserMenu["UserMenu<br/>DropdownMenu — Switch Role"]

    AL --> Pages

    Pages --> DP["page.tsx<br/>Degree Planner"]
    DP --> FS["FilterSidebar<br/>filter-sidebar.tsx"]
    FS --> MajorRadio["Major Radio Buttons<br/>CS · MATH · BA"]
    FS --> YearCheck["Year Checkboxes<br/>AY16–AY26"]
    FS --> SearchInput["Course Search Input"]

    DP --> RC["Requirement Checklist Card"]
    RC --> GroupBadges["RequirementGroup Badges"]
    RC --> GenBtn["Generate Plan Button"]
    RC --> PlanSummary["Plan Summary + Save Button"]
    RC --> SaveModal["Save Plan Modal"]

    DP --> KPI["KpiCard<br/>Avg GPA · Total Courses"]
    DP --> CC["CourseCard<br/>course-card.tsx"]
    CC --> Chart["GradeDistributionChart<br/>Recharts BarChart"]
    CC --> InstructorRows["InstructorRow<br/>Add to Plan button"]

    Pages --> SP["saved-plans/page.tsx<br/>My Degree Plan"]
    SP --> PlanCard["SavedPlanCard<br/>Export PDF · Delete"]

    Pages --> Admin["admin/page.tsx<br/>Admin Portal"]
    Admin --> CSV["CsvUploadZone<br/>csv-upload-zone.tsx"]
    Admin --> GroupEditor["RequirementGroupEditor<br/>Accordion"]
    GroupEditor --> AddCourseForm["Add Course Form<br/>Subject → Course → Seq Tag"]
```

### 3b. State & Data Flow (static)

State owned by `page.tsx` and which components read or write each variable.

```mermaid
graph LR
    subgraph State ["page.tsx state"]
        S1[selectedYears]
        S2[selectedSubject]
        S3[searchQuery]
        S4[viewMode]
        S5[selectedInstructor]
        S6[courses]
        S7[requirementGroups]
        S8[planItems]
    end

    FS2[FilterSidebar] -->|writes| S1
    FS2 -->|writes| S2
    FS2 -->|writes| S3

    S1 -->|triggers fetch| API1["/api/courses"]
    S2 -->|triggers fetch| API1
    S2 -->|triggers fetch| API2["/api/requirements"]
    S3 -->|triggers fetch| API1
    S4 -->|triggers fetch| API1
    S5 -->|triggers fetch| API1

    API1 -->|sets| S6
    API2 -->|sets| S7

    S6 -->|renders| CC2[CourseCard list]
    S7 -->|renders| RC2[Requirement Checklist]
    S8 -->|renders| PS[Plan Summary]

    CC2 -->|onAddToPlan| S8
    GenBtn2[Generate Plan] -->|bulk fetch + logic| S8
    S8 -->|checkmarks| RC2
```

### 3c. User Journey — Select Major → Pick Courses → Save → Export PDF (dynamic)

End-to-end walkthrough of the primary user flow. Each arrow names the exact function, state variable, or API call responsible.

```mermaid
sequenceDiagram
    actor User
    participant FS as FilterSidebar<br/>filter-sidebar.tsx
    participant Page as page.tsx
    participant CC as CourseCard<br/>course-card.tsx
    participant LS as localStorage<br/>saved-plans.ts
    participant API as FastAPI
    participant SP as saved-plans/page.tsx

    Note over User,API: 1 — SELECT A MAJOR
    User->>FS: clicks "Computer Science" radio button
    FS->>Page: onSubjectChange("CS") → setSelectedSubject("CS")
    Page->>API: fetch("/api/requirements?major=CS")
    API->>Page: RequirementGroup[] (Lower-Division Core, Upper-Division Core)
    Page->>Page: setRequirementGroups(data)
    Page->>Page: re-derives reqSubjects from requirementGroups<br/>builds subjects param "CS,MATH"
    Note over Page: Requirement checklist renders with unchecked groups

    Note over User,API: 2 — SELECT A YEAR
    User->>FS: checks "AY26" checkbox (already pre-selected on load)
    FS->>Page: onYearsChange(["AY26"]) → setSelectedYears(["AY26"])
    Page->>API: fetch("/api/courses?subjects=CS,MATH&years=AY26")
    API->>Page: CourseResult[] (code, name, avgGpa, gradeData[])
    Page->>Page: setCourses(data)
    Page->>Page: displayedCourses = filter by selectedSubject + requiredCodes,<br/>sort required courses first
    Page->>Page: renders KpiCard (avg GPA, course count) + CourseCard[]

    Note over User,API: 3 — BROWSE A COURSE & PICK AN INSTRUCTOR
    User->>CC: expands CourseCard for "CS 313"
    CC->>API: fetch("/api/course-instructors?code=CS%20313")
    API->>CC: InstructorResult[] ranked by avgGpa
    CC->>User: shows instructor rows with GPA + grade bar
    User->>CC: clicks "Add" on preferred instructor row
    CC->>Page: onAddToPlan({code:"CS 313", instructor:"Smith", avgGpa:3.72, gradeData:[]})
    Page->>Page: handleAddToPlan(item)
    Page->>LS: addDraftItem(item) → reads maxgpa-plan-draft, appends, writes back
    LS->>Page: returns updated PlanItem[]
    Page->>Page: setPlanItems(updated), setPlanGrades(updated.map(avgGpa))
    Page->>Page: planCodes now includes "CS 313"<br/>isGroupMet() re-evaluates → badge turns green

    Note over User,API: 4 — REPEAT FOR MORE COURSES (user adds all required courses)
    User->>CC: clicks "Add" on more CourseCards...
    Note over Page: allGroupsMet(requirementGroups, planCodes) → true<br/>canSave becomes true → "Save Plan" button enables

    Note over User,SP: 5 — SAVE THE PLAN
    User->>Page: clicks "Save Plan" button
    Page->>Page: openSaveModal()<br/>setPlanName("Computer Science — Apr 30, 2026")<br/>setShowSaveModal(true)
    User->>Page: edits plan name (optional), clicks "Save"
    Page->>Page: handleSave()<br/>avg = planItems.reduce(sum of avgGpa) / count
    Page->>LS: savePlan({planName, subject:"CS", subjectLabel, createdDate, items, avgGpa})<br/>→ generates id = Date.now()<br/>→ reads maxgpa-saved-plans[], appends, writes back
    Page->>LS: clearDraft() → deletes maxgpa-plan-draft from localStorage
    Page->>Page: setPlanItems([]), setShowSaveModal(false), setSavedConfirm(true)
    Page->>User: toast "Plan saved — view in My Degree Plan" (auto-hides after 2.5s)

    Note over User,SP: 6 — EXPORT PDF FROM SAVED PLANS
    User->>SP: navigates to /saved-plans
    SP->>LS: getSavedPlans() → reads maxgpa-saved-plans[] from localStorage
    LS->>SP: SavedPlan[]
    SP->>User: renders plan card (planName, courses, instructors, avg GPA)
    User->>SP: clicks "Export PDF"
    SP->>SP: handleExport(plan) → setExporting(plan.id)
    SP->>SP: dynamic import jsPDF + html-to-image (lazy loaded)
    SP->>SP: toCanvas(document.getElementById("plan-{id}"), {pixelRatio:2})<br/>renders DOM node to canvas at 2x resolution
    SP->>SP: new jsPDF("p","mm","a4")<br/>pdf.addImage(canvas, 0, 0, pageW, imgH)<br/>loop: addPage() + addImage() until content fits
    SP->>SP: pdf.save("{plan-name}.pdf")
    SP->>User: browser downloads PDF file
```

### 3d. "Generate Optimal Plan" Sequence (dynamic)

Alternative to manually picking courses — auto-selects the best instructor per requirement group.

```mermaid
sequenceDiagram
    participant User
    participant Page as page.tsx
    participant API as FastAPI
    participant LS as localStorage

    User->>Page: clicks "Generate Plan"
    Page->>Page: collect all course codes from requirementGroups[]
    Page->>API: GET /api/bulk-best-instructors?codes=CS210,CS211,...
    API->>Page: map of code → best InstructorResult

    loop For each RequirementGroup
        alt type = "all"
            Page->>Page: add every course with its best instructor
        else type = "choose_from"
            Page->>Page: pick course with highest avgGpa
        else type = "one_sequence"
            Page->>Page: compute avg GPA per sequence tag (A/B/C)<br/>pick entire sequence with highest avg
        end
    end

    Page->>LS: clearDraft()
    loop For each selected PlanItem
        Page->>LS: addDraftItem(code, instructor, avgGpa, gradeData)
    end
    Page->>Page: setPlanItems(newPlan), setPlanGrades(...)
    Page->>Page: re-render checklist — all groups show green checkmarks
```
