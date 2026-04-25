## Degree Requirements & Admin Portal — 2026-04-25

### Database
`Major_Requirements` table recreated with clean schema: `ReqID`, `Major` (CS/MATH/BA), `Subject`, `CourseNumber`, `UNIQUE(Major, Subject, CourseNumber)`. The old schema (MajorID, Year, Term, Title columns) was dropped.

### API — 3 new endpoints
- `GET /api/requirements?major=CS` — returns `{id, code, name}[]` via LEFT JOIN with CourseTitles
- `POST /api/requirements` — body `{major, subject, courseNumber}`, returns `{id}`, 409 on duplicate
- `DELETE /api/requirements/{id}` — removes a requirement

### Admin page (`app/admin/page.tsx`)
Full rewrite. Major tab selector (CS / Math / BA). For the selected major: live requirement list with Remove buttons; Add footer with a dropdown of all courses for that subject (already-added ones filtered out) and an Add Requirement button. CSV import section retained.

### Student dashboard (`app/page.tsx`)
- Fetches `requirements` for `selectedSubject` on major change
- Requirements checklist panel shown above KPI cards when requirements exist: pill per requirement, green+checkmark when that course is in `planItems`, grey+circle otherwise
- Save Plan button lives inside the checklist panel (when requirements exist) and is disabled until all requirements are met (`requirements.every(r => planItems.some(p => p.code === r.code))`)
- Falls back to old Save Plan button (disabled when planItems empty) when no requirements are defined

### CourseCard (`app/components/course-card.tsx`)
New `isRequired?: boolean` prop. When true, shows an indigo "Required" badge next to the course code. Dashboard passes `isRequired={requiredCodes.has(course.code)}`.

---

## Course Titles — 2026-04-24

### CourseTitles table
Added `CourseTitles` SQLite table (`Subject`, `CourseNumber`, `Title`) populated from the raw CSV's `TITLE` column (which was present but not imported during initial ingestion). 7,231 unique subject+course pairs loaded via `db/grade_data.db`.

### API change — `/api/courses`
`/api/courses` now LEFT JOINs `CourseTitles` and returns a `name` field alongside `code`. Courses with no matching title return `null` for `name`.

### Frontend changes
- `Course` interface in `app/page.tsx` gained optional `name?: string`
- `name` prop is passed through to `CourseCard`, which already had a `name` prop and renders it as a subtitle line below the course code

---

## Design System v2 — Implementation Notes (2026-04-24)

### Fonts
Switched body font from Geist Sans to **Barlow**, headings to **Barlow Semi Condensed** (self-hosted TTFs in `public/fonts/`). Geist Mono is retained for tabular/numeric contexts. `@font-face` declarations live in `app/styles/fonts.css`. The font-sans and font-display CSS custom properties are wired into Tailwind v4 via `@theme inline` in `theme.css`.

### Typography
Heading base styles in `@layer base` now use `--font-display-stack` (Barlow Semi Condensed) with:
- h1/h2: semibold (600), line-height 1.25, letter-spacing −0.025em
- h3/h4: medium (500), line-height 1.375

### Buttons
All buttons use pill shape (`rounded-full`). Primary CTA buttons use `.btn-forest` (defined in `@layer components` in `theme.css`) which applies a subtle forest-green gradient with an inner top-highlight shadow instead of flat `bg-forest-900`.

### Color tokens
Full emerald scale (100–700), named slate scale (50–900), grade semantic colors (`--grade-a/b/c/dnf`), rose and amber palette added to `:root` in `theme.css`. Grade/verdict color tokens exposed via `@theme inline` as `color-grade-*`.

### Assets
Oregon Duck mascot (`/assets/oregon-duck.webp`) copied to `public/assets/`.

---

should i use client-side (useEffect / Actions) or Server-Side (URL Params)?  
                                                                              
    ⏺ For this dashboard, the right split is both — not one or the other.          
                                                                                
    URL params for Major + Year (the API-triggering filters): these change what  
    data you fetch, they're discrete/bookmarkable, and the back button should    
    work. A student should be able to share ?major=CS&years=AY22,AY23.           
                    
    Local state for Search + Instructor toggle: these just filter the            
    already-fetched course list client-side, as your current filteredCourses     
    logic does. No API call needed, no reason to put them in the URL.            
                    
    The practical shape in Next.js App Router:                                   
    - Dashboard page becomes a server component that reads searchParams and
    fetches from FastAPI                                                         
    - FilterSidebar becomes a client component that calls router.push() to update
    the URL when Major/Year changes                                             
    - Search and instructor toggle stay as useState inside the client layout     
    wrapper                                                                 
                                                                                
    The main tradeoff vs. pure useEffect: slightly more restructuring now (the
    dashboard is currently all "use client"), but you avoid a loading flash on   
    every filter change since the server renders the new data before the page
    arrives in the browser.    




Here's a plain breakdown of each feature based on the actual project intent:                
                                               
  ---                     
  Filters (Major, Year, Instructor)
  The core of the app. A student selects their  
  major, which scopes the data to only the    
  courses required for that degree. Year lets   
  them narrow to a specific time window — useful
   because grade distributions shift as         
  instructors change or courses get           
  restructured. These two together answer "what
  does this major actually look like,          
  grade-wise, right now?" The instructor filter
  is the sharpest tool: it lets a student find 
  which specific section of a required course 
  gives the best grades, so they can         
  intentionally schedule around that instructor.
                                                
  View Mode (All Instructors / Specific Teacher)
  Two different questions. "All Instructors"    
  gives you the aggregate picture of a course — 
  how hard is CS 313 overall? "Specific Teacher"
   lets you drill into a single instructor's    
  record — how hard is CS 313 with Dr. X      
  specifically? The toggle is the switch between
   those two modes of analysis.

  Degree Plan
  The Major_Requirements table links majors to
  the specific courses required for a degree.   
  The intent is that when a student picks
  "Computer Science," the app doesn't just show 
  all CS-prefixed courses — it shows the exact
  required sequence for that degree. This is
  what makes the tool a planning tool rather
  than just a grade lookup. The degree plan data
   would need to be loaded from CSVs into
  data/meta/degree_plans/, which is currently
  they can intentionally schedule around that instructor.

  View Mode (All Instructors / Specific Teacher)
  Two different questions. "All Instructors" gives you the
  aggregate picture of a course — how hard is CS 313 overall?
  "Specific Teacher" lets you drill into a single instructor's
  record — how hard is CS 313 with Dr. X specifically? The toggle
  is the switch between those two modes of analysis.

  Degree Plan
  The Major_Requirements table links majors to the specific
  courses required for a degree. The intent is that when a student
   picks "Computer Science," the app doesn't just show all
  CS-prefixed courses — it shows the exact required sequence for
  that degree. This is what makes the tool a planning tool rather
  than just a grade lookup. The degree plan data would need to be
  loaded from CSVs into data/meta/degree_plans/, which is
  currently empty.

  Saved Plans
  Mentioned in the README SRS: students can generate and save a
  plan for future reference. The intent is that after a student
  uses the filters and view mode to identify the optimal
  instructor sequence for their required courses, they can save
  that configuration — essentially a personalized degree roadmap.
  This feature doesn't exist in the codebase yet.

  Export Report
  Robert's original README notes "Generate Report button" and
  "Option to export the graph as a PDF." It's a way to take the
  on-screen plan out of the app — print it, share it with an
  advisor, reference it during registration. Not in the formal
  requirements docs, but it was part of the original design
  thinking.

  ---
  The short version: filters + view mode are how you find the
  optimal path. Degree plan is what defines what courses that path
   must include. Saved plans and export are how you keep and share
   the result.