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

[Sat May 2] 
## Changes Made (Session Log)

### 1. React Compiler disabled — `next.config.ts`

`reactCompiler: true` caused the dev server to hang on first request (it connected but never responded). It was disabled until the compiler is properly configured for this Next.js version.

**File:** `next.config.ts`

```ts
// Before
reactCompiler: true,

// After
reactCompiler: false,
```

---

### 2. Your Plan section redesigned — `app/page.tsx`

The plan panel was a narrow fixed `w-56` (224px) column. It was widened to `w-80` (320px) and reorganized:

- Header row shows "Your Plan (N)" and "Avg GPA: X.XX" side by side
- Course list now shows: `code | instructor | avg GPA | ✕`
- Generate Plan, Save Plan, and Clear are now in one action row at the bottom
- A left border separates the plan column from the requirements column on desktop

The **Generate Plan** button's hover shadow (`hover:shadow-xl hover:shadow-violet-500/60`) was visually bleeding into the plan items below it. It was replaced with a static non-expanding shadow:

```tsx
// Before — shadow expands and glows on hover, clashing with items below
className="... shadow-lg shadow-violet-500/40 hover:shadow-xl hover:shadow-violet-500/60 ..."

// After — consistent shadow that doesn't expand
className="... shadow-md shadow-violet-500/30 hover:brightness-110 ..."
```

---

### 3. Generate Plan respects manual selections — `app/page.tsx`

Previously, clicking Generate Plan would replace every course in Your Plan with the highest-GPA option, overriding any instructor you had manually chosen.

Now it builds a map of your existing selections before generating, and only fills in courses you haven't already picked:

```ts
// Build map of what the user already chose
const existingByCode = new Map<string, PlanItem>();
for (const item of planItems) {
  existingByCode.set(item.code, item);
}

// Per group type:
// "all"          → use existing selection for that code, fall back to best instructor
// "choose_from"  → if any course from the group is already chosen, keep it; else auto-pick
// "one_sequence" → if a full sequence is already in the plan, keep it; else auto-pick best avg
```

---

### 4. Upgrade suggestions with Swap — `app/page.tsx`

When your plan contains courses where a higher-GPA instructor is available, an amber panel appears below the requirements checklist listing each possible swap.

**How it works:**

A `useEffect` fires whenever `planItems` changes. It calls `/api/bulk-best-instructors` for the codes in your current plan, then compares each item's instructor against the best available:

```ts
useEffect(() => {
  if (planItems.length === 0) { setUpgradeSuggestions([]); return; }
  const codes = planItems.map((i) => i.code).join(",");
  fetch(`/api/bulk-best-instructors?codes=${encodeURIComponent(codes)}`)
    .then((r) => r.json())
    .then((best: Record<string, PlanItem>) => {
      const suggestions: UpgradeSuggestion[] = [];
      for (const item of planItems) {
        const b = best[item.code];
        if (b && b.instructor !== item.instructor && b.avgGpa > item.avgGpa) {
          suggestions.push({
            code: item.code,
            currentInstructor: item.instructor,
            currentGpa: item.avgGpa,
            betterItem: { ...b, code: item.code },
          });
        }
      }
      setUpgradeSuggestions(suggestions);
    });
}, [planItems]);
```

Each suggestion shows: `CODE  current instructor (GPA)  →  better instructor (GPA)  [Swap]`

Clicking **Swap** calls `handleSwap`, which removes the current item from the draft and adds the better one:

```ts
const handleSwap = (code: string, currentInstructor: string, betterItem: PlanItem) => {
  removeDraftItem(code, currentInstructor, selectedSubject);
  const updated = addDraftItem(betterItem, selectedSubject);
  setPlanItems(updated);
  setPlanGrades(updated.map((x) => x.avgGpa));
};
```

**New types added:**

```ts
interface UpgradeSuggestion {
  code: string;
  currentInstructor: string;
  currentGpa: number;
  betterItem: PlanItem;   // full PlanItem so Swap can call addDraftItem directly
}
```

---

### 5. Course requirement clicks snap instead of scroll — `app/page.tsx`

Clicking a course badge in the requirements checklist used to animate a smooth scroll. Changed to instant:

```ts
// Before
element.scrollIntoView({ behavior: "smooth", block: "center" });

// After
element.scrollIntoView({ behavior: "instant", block: "center" });
```

---

### 6. "Back to requirements" floating button — `app/page.tsx`

After jumping to a course, a centered floating pill button appears at the bottom of the screen. It snaps back to the very top of the page (showing the nav) and disappears when you're already at the top.

**How it works:**

- `mainRef` (a `useRef<HTMLElement>`) is attached to the `<main>` scroll container
- A scroll listener sets `scrolledDown` to `true` whenever `scrollTop > 0`
- The button renders only when `scrolledDown` is true

```ts
const mainRef = useRef<HTMLElement>(null);
const [scrolledDown, setScrolledDown] = useState(false);

// Scroll listener
useEffect(() => {
  const el = mainRef.current;
  if (!el) return;
  const onScroll = () => setScrolledDown(el.scrollTop > 0);
  el.addEventListener("scroll", onScroll, { passive: true });
  return () => el.removeEventListener("scroll", onScroll);
}, []);

// Snap to top
const scrollToTop = () => {
  mainRef.current?.scrollTo({ top: 0, behavior: "instant" });
};
```

```tsx
{/* In JSX */}
<main ref={mainRef} className="flex-1 overflow-auto">

{scrolledDown && (
  <button onClick={scrollToTop} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 ...">
    ↑ Back to requirements
  </button>
)}
```

---

### 7. Filter sidebar reorganized — `app/components/filter-sidebar.tsx`

All four filter sections were previously ordered Major → Year → Search Courses → Instructor. The Year list's `max-h-56` scroll window pushed Instructor out of the viewport, requiring users to scroll to see it.

**Changes:**

- Section order changed to: **Search Courses → Instructor → Major → Year** (search inputs first)
- Accordion panel padding reduced from `p-4` to `p-3` (trigger) and `px-3 pb-3` (content) to save vertical space
- Year list scroll window reduced from `max-h-56` to `max-h-36`
- Gap between accordion items reduced from `space-y-4` to `space-y-3`
- `lg:overflow-auto` added to the `<aside>` so the sidebar scrolls independently on very short viewports
- `defaultValue` updated to match the new order: `["course", "instructor", "subject", "year"]`

```tsx
// Before
<Accordion.Root defaultValue={["year", "subject", "course", "instructor"]} className="space-y-4">
  {/* Major, Year, Search Courses, Instructor */}

// After
<Accordion.Root defaultValue={["course", "instructor", "subject", "year"]} className="space-y-3">
  {/* Search Courses, Instructor, Major, Year */}
```

---

### 8. CourseCard instructor button states — `app/components/course-card.tsx`

Previously every instructor row showed either **+ Add** or **✓ Added** based solely on whether that exact instructor was in the plan. There was no way to switch instructors from the course card once one was added.

**New behavior:** when any instructor for a course is already in Your Plan, all other instructor rows for that same course show a **Swap** button instead of **+ Add**. Clicking Swap removes the current instructor from the draft and adds the new one in a single action.

**New prop added to `CourseCard`:**

```tsx
onSwapInPlan?: (newItem: PlanItem) => void;
```

**Button state logic** (per instructor row):

```tsx
const currentPlanItem = planItems.find((i) => i.code === code);

// same instructor already in plan → non-interactive "Added" span
if (isInPlan(row.instructor)) → <span>✓ Added</span>

// different instructor for same course is in plan → Swap button
if (currentPlanItem && row.instructor !== currentPlanItem.instructor) → <button>Swap</button>

// no instructor for this course in plan → Add button
else → <button>+ Add</button>
```

**In `app/page.tsx`**, `onSwapInPlan` is wired to find the current plan entry for that code and call `handleSwap`:

```tsx
onSwapInPlan={(newItem) => {
  const current = planItems.find((i) => i.code === newItem.code);
  if (current) handleSwap(newItem.code, current.instructor, newItem);
}}
```

**Tests — `tests/app_tests/course-card-swap.test.tsx`:**

| Test | What it verifies |
|------|-----------------|
| `shows Add for all instructors when no instructor for this course is in the plan` | Both rows show Add; no Swap or Added present |
| `shows Added for the instructor already in the plan` | The added instructor's row renders a non-interactive Added span |
| `shows Swap for other instructors when one instructor for the same course is in the plan` | Added + Swap coexist; no Add button remains |
| `calls onSwapInPlan with the new item when Swap is clicked` | `onSwapInPlan` receives the correct `PlanItem` (Dr. Jones row) |
| `calls onAddToPlan with the correct item when Add is clicked` | `onAddToPlan` receives the correct `PlanItem` (first instructor) |
| `does not call onSwapInPlan when the already-added instructor row is clicked` | Added is a `<span>`, not a button — clicking it is a no-op |

---

### 9. Saved plans sorted by newest first — `app/lib/saved-plans.ts`

In the "My Degree Plan" page, saved plans were previously displayed in the order they were stored in `localStorage` (typically the order they were created, oldest first).

Now, the `getSavedPlans` function automatically sorts all plans by their `createdDate` in descending order before returning them to the UI. This ensures the student always sees their most recent plans at the top.

**Implementation:**

```ts
export function getSavedPlans(): SavedPlan[] {
  if (typeof window === "undefined") return [];
  try {
    const plans: SavedPlan[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    // Sort by createdDate (newest first)
    return plans.sort((a, b) => 
      new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
    );
  } catch {
    return [];
  }
}
```

**Tests — `tests/app_tests/saved-plans-sort.test.ts`:**

| Test | What it verifies |
|------|-----------------|
| `should sort plans with the newest createdDate first` | Saves 3 plans with different years/months and verifies `getSavedPlans()` returns them in Newest → Middle → Old order. |
| `should handle same-day plans correctly based on full ISO string` | Verifies that even if two plans are saved on the same day, the one saved later in the day (based on ISO timestamp) appears first. |

