"use client";

import { useEffect, useState } from "react";
import { FilterSidebar } from "./components/filter-sidebar";
import { KpiCard } from "./components/kpi-card";
import { CourseCard } from "./components/course-card";
import { Check, CheckCircle2, Circle, Download, Save, X, Sparkles, Loader2 } from "lucide-react";
import { savePlan, getDraftItems, addDraftItem, removeDraftItem, clearDraft } from "./lib/saved-plans";
import type { PlanItem } from "./lib/saved-plans";
import { isGroupMet, allGroupsMet, groupBySequence } from "./lib/requirements";
import type { RequirementGroup } from "./lib/requirements";

interface GradeEntry {
  grade: string;
  count: number;
  percentage: number;
}

interface Course {
  code: string;
  name?: string;
  avgGpa: number;
  gradeData: GradeEntry[];
}

const MAJOR_LABELS: Record<string, string> = {
  CS:   "Computer Science",
  MATH: "Mathematics",
  BA:   "Business",
};

const courseCache = new Map<string, Course[]>();
const requirementsCache = new Map<string, RequirementGroup[]>();

export default function DashboardPage() {
  "use no memo";
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("CS");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedInstructor, setSelectedInstructor] = useState<string>("");
  const [instructors, setInstructors] = useState<string[]>([]);
  const [planGrades, setPlanGrades] = useState<number[]>([]);

  const [courses, setCourses] = useState<Course[]>([]);
  const [requirementGroups, setRequirementGroups] = useState<RequirementGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [planName, setPlanName] = useState("");
  const [savedConfirm, setSavedConfirm] = useState(false);
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);

  useEffect(() => {
    const draft = getDraftItems(selectedSubject);
    setPlanItems(draft);
    setPlanGrades(draft.map((x) => x.avgGpa));
  }, [selectedSubject]);

  useEffect(() => {
    if (!selectedSubject) return;
    const url = `/api/requirements?major=${selectedSubject}`;
    if (requirementsCache.has(url)) {
      setRequirementGroups(requirementsCache.get(url)!);
      return;
    }
    fetch(url)
      .then((r) => r.json())
      .then((data: RequirementGroup[]) => {
        requirementsCache.set(url, data);
        setRequirementGroups(data);
      })
      .catch(() => setRequirementGroups([]));
  }, [selectedSubject]);

  const handleAddToPlan = (item: PlanItem) => {
    const updated = addDraftItem(item, selectedSubject);
    setPlanItems(updated);
    setPlanGrades(updated.map(X => X["avgGpa"]));
  };

  const handleRemoveFromPlan = (code: string, instructor: string) => {
    const updated = removeDraftItem(code, instructor, selectedSubject);
    setPlanItems(updated);
    setPlanGrades(updated.map(X => X["avgGpa"]));
  };

  const handleGeneratePlan = async () => {
    if (requirementGroups.length === 0) return;
    setGenerating(true);
    
    try {
      // 1. Get all course codes involved in requirements
      const allCodes = Array.from(new Set(requirementGroups.flatMap(g => g.courses.map(c => c.code))));
      
      // 2. Fetch best instructors for all these courses in bulk
      const resp = await fetch(`/api/bulk-best-instructors?codes=${encodeURIComponent(allCodes.join(","))}`);
      if (!resp.ok) throw new Error("Failed to fetch best instructors");
      const bestInstructors: Record<string, PlanItem> = await resp.json();

      const newPlan: PlanItem[] = [];
      const addedCodes = new Set<string>();

      for (const group of requirementGroups) {
        if (group.type === "all") {
          for (const c of group.courses) {
            if (bestInstructors[c.code] && !addedCodes.has(c.code)) {
              newPlan.push({ ...bestInstructors[c.code], code: c.code });
              addedCodes.add(c.code);
            }
          }
        } else if (group.type === "choose_from") {
          // Find the course in this group with the highest avgGpa among best instructors
          let best: PlanItem | null = null;
          for (const c of group.courses) {
            const item = bestInstructors[c.code];
            if (item && (!best || item.avgGpa > best.avgGpa)) {
              best = { ...item, code: c.code };
            }
          }
          if (best && !addedCodes.has(best.code)) {
            newPlan.push(best);
            addedCodes.add(best.code);
          }
        } else if (group.type === "one_sequence") {
          const sequences = groupBySequence(group.courses);
          let bestSeq: PlanItem[] = [];
          let bestSeqAvg = -1;

          for (const [, seqCourses] of Object.entries(sequences)) {
            const seqItems = seqCourses
              .map(c => bestInstructors[c.code] ? { ...bestInstructors[c.code], code: c.code } : null)
              .filter((i): i is PlanItem => i !== null);
            
            if (seqItems.length === seqCourses.length) {
              const avg = seqItems.reduce((s, i) => s + i.avgGpa, 0) / seqItems.length;
              if (avg > bestSeqAvg) {
                bestSeqAvg = avg;
                bestSeq = seqItems;
              }
            }
          }

          for (const item of bestSeq) {
            if (!addedCodes.has(item.code)) {
              newPlan.push(item);
              addedCodes.add(item.code);
            }
          }
        }
      }

      // Update local draft
      clearDraft(selectedSubject);
      newPlan.forEach(item => addDraftItem(item, selectedSubject));
      setPlanItems(newPlan);
      setPlanGrades(newPlan.map(X => X["avgGpa"]));
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const majorLabel = MAJOR_LABELS[selectedSubject] ?? selectedSubject;

  const planCodes = new Set(planItems.map((p) => p.code));
  const canSave =
    requirementGroups.length === 0
      ? planItems.length > 0
      : allGroupsMet(requirementGroups, planCodes);
  const metGroupCount = requirementGroups.filter((g) => isGroupMet(g, planCodes)).length;

  const openSaveModal = () => {
    const date = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    setPlanName(`${majorLabel} — ${date}`);
    setShowSaveModal(true);
  };

  const handleSave = () => {
    if (!planName.trim() || planItems.length === 0) return;
    const avg = planItems.reduce((s, i) => s + i.avgGpa, 0) / planItems.length;
    savePlan({
      planName: planName.trim(),
      subject: selectedSubject,
      subjectLabel: majorLabel,
      createdDate: new Date().toISOString(),
      items: planItems,
      avgGpa: Math.round(avg * 100) / 100,
    });
    clearDraft(selectedSubject);
    setPlanItems([]);
    setShowSaveModal(false);
    setSavedConfirm(true);
    setTimeout(() => setSavedConfirm(false), 2500);
  };

  const handleExport = async () => {
    setExporting(true);
    await new Promise((r) => setTimeout(r, 50));

    const [{ default: jsPDF }, { toCanvas }] = await Promise.all([
      import("jspdf"),
      import("html-to-image"),
    ]);

    const content = document.getElementById("report-content")!;
    const canvas = await toCanvas(content, { pixelRatio: 2 });

    const pdf = new jsPDF("p", "mm", "a4");
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;

    let remaining = imgH;
    let offset = 0;

    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, offset, imgW, imgH);
    remaining -= pageH;

    while (remaining > 0) {
      offset -= pageH;
      pdf.addPage();
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, offset, imgW, imgH);
      remaining -= pageH;
    }

    const filename = `maxgpa-${selectedSubject || "report"}-${new Date().toISOString().slice(0, 10)}.pdf`;
    pdf.save(filename);
    setExporting(false);
  };

  useEffect(() => {
    fetch(`/api/instructors?subject=${selectedSubject}`)
      .then((r) => r.json())
      .then((data: string[]) => {
        setInstructors(data);
        setSelectedInstructor("");
      })
      .catch(() => {});
  }, [selectedSubject]);

  useEffect(() => {
    if (selectedYears.length === 0) {
      setCourses([]);
      setLoading(false);
      setError(null);
      return;
    }

    // Collect all subjects needed: the selected major plus any subjects present in requirements
    const reqSubjects = new Set(
      requirementGroups.flatMap((g) => g.courses.map((c) => c.code.split(" ")[0]))
    );
    if (selectedSubject) reqSubjects.add(selectedSubject);
    const subjectsParam = Array.from(reqSubjects).join(",");

    const params = new URLSearchParams();
    if (subjectsParam) params.set("subjects", subjectsParam);
    params.set("years", [...selectedYears].sort().join(","));
    if (searchQuery) params.set("search", searchQuery);
    if (selectedInstructor) params.set("instructor", selectedInstructor);

    const url = `/api/courses?${params.toString()}`;

    if (courseCache.has(url)) {
      setCourses(courseCache.get(url)!);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`API error ${r.status}`);
        return r.json();
      })
      .then((data: Course[]) => {
        courseCache.set(url, data);
        setCourses(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message ?? "Failed to load courses");
        setLoading(false);
      });
  }, [selectedSubject, selectedYears, searchQuery, selectedInstructor, requirementGroups]);

  const requiredCodes = new Set(requirementGroups.flatMap((g) => g.courses.map((c) => c.code)));

  const scrollToCourse = (code: string) => {
    const element = document.getElementById(`course-${code.replace(/\s+/g, "-")}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const requiredCodesOrdered = requirementGroups.flatMap((g) => g.courses.map((c) => c.code));
  const codeToIndex = new Map<string, number>();
  requiredCodesOrdered.forEach((code, index) => {
    if (!codeToIndex.has(code)) {
      codeToIndex.set(code, index);
    }
  });

  const courseOrder = (c: Course): number => {
    if (codeToIndex.has(c.code)) {
      return codeToIndex.get(c.code)!;
    }
    // Non-required courses come after all requirements
    return 10000 + (c.code.charCodeAt(0) * 100) + (parseInt(c.code.split(" ")[1]) || 0);
  };

  const displayedCourses = courses
    .filter((c) => c.code.startsWith(selectedSubject + " ") || requiredCodes.has(c.code))
    .sort((a, b) => courseOrder(a) - courseOrder(b));

  const avgGpa =
    displayedCourses.length > 0
      ? displayedCourses.reduce((sum, c) => sum + c.avgGpa, 0) / displayedCourses.length
      : 0;

  const yearsLabel = selectedYears.length > 0 ? selectedYears.join(", ") : "All years";
  const instructorLabel = selectedInstructor || "All instructors";

  return (
    <>
    <div className="flex h-[calc(100vh-80px)] print:block print:h-auto">
      <FilterSidebar
        selectedYears={selectedYears}
        onYearsChange={setSelectedYears}
        selectedSubject={selectedSubject}
        onSubjectChange={setSelectedSubject}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        instructors={instructors}
        selectedInstructor={selectedInstructor}
        onInstructorChange={setSelectedInstructor}
      />

      <main className="flex-1 overflow-auto">
        <div id="report-content" className="p-8 max-w-7xl mx-auto">

          {/* Report header — shown when exporting or printing */}
          <div className={`${exporting ? "block" : "hidden"} print:block mb-8 pb-6 border-b border-slate-200`}>
            <h1 className="text-2xl font-semibold text-slate-900 mb-1">
              MaxGPA — Grade Distribution Report
            </h1>
            <p className="text-sm text-slate-500">University of Oregon</p>
            <div className="mt-4 flex flex-wrap gap-6 text-sm text-slate-700">
              <span><span className="font-medium">Major:</span> {majorLabel}</span>
              <span><span className="font-medium">Years:</span> {yearsLabel}</span>
              <span><span className="font-medium">Instructor:</span> {instructorLabel}</span>
            </div>
          </div>

          {/* Controls bar */}
          <div className="mb-4 flex items-center justify-end print:hidden">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-5 py-2.5 text-white rounded-full btn-forest disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              {exporting ? "Generating…" : "Export Report"}
            </button>
          </div>

          {/* Requirements checklist + Save Plan */}
          <div className="mb-6 rounded-xl border border-slate-200 bg-white print:hidden">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start p-5">
              {/* Groups */}
              <div className="flex-1 space-y-4">
                {requirementGroups.length > 0 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-700">
                      {majorLabel} Requirements — {metGroupCount}/{requirementGroups.length} sections complete
                    </p>
                    <button
                      onClick={handleGeneratePlan}
                      disabled={generating}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      {generating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      Generate Plan
                    </button>
                  </div>
                )}

                {requirementGroups.map((group) => {
                  const met = isGroupMet(group, planCodes);
                  return (
                    <div key={group.groupId}>
                      <div className="flex items-center gap-2 mb-2">
                        {met
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          : <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                        }
                        <span className={`text-xs font-semibold uppercase tracking-wide ${met ? "text-emerald-600" : "text-slate-500"}`}>
                          {group.groupName}
                        </span>
                        {group.type === "one_sequence" && (
                          <span className="text-xs text-slate-400">— choose one sequence</span>
                        )}
                        {group.type === "choose_from" && (
                          <span className="text-xs text-slate-400">— choose at least one</span>
                        )}
                      </div>

                      {group.type === "all" && (
                        <div className="flex flex-wrap gap-1.5 pl-6">
                          {group.courses.map((c) => {
                            const courseMet = planCodes.has(c.code);
                            return (
                              <span
                                key={c.id}
                                onClick={() => scrollToCourse(c.code)}
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors ${
                                  courseMet
                                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                }`}
                              >
                                {courseMet ? <Check className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                                {c.code}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {group.type === "one_sequence" && (
                        <div className="flex flex-wrap gap-2 pl-6">
                          {Object.entries(groupBySequence(group.courses)).map(([tag, courses], idx, arr) => {
                            const seqMet = courses.every((c) => planCodes.has(c.code));
                            return (
                              <div key={tag} className="flex items-center gap-1.5">
                                <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border ${
                                  seqMet
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-slate-200 bg-slate-50 text-slate-600"
                                }`}>
                                  {seqMet && <Check className="w-3 h-3" />}
                                  {courses.map((c, i) => (
                                    <span
                                      key={c.id}
                                      onClick={() => scrollToCourse(c.code)}
                                      className="hover:underline cursor-pointer"
                                    >
                                      {c.code}
                                      {i < courses.length - 1 ? " + " : ""}
                                    </span>
                                  ))}
                                </span>
                                {idx < arr.length - 1 && (
                                  <span className="text-xs text-slate-400 font-medium">OR</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {group.type === "choose_from" && (
                        <div className="flex flex-wrap gap-1.5 pl-6">
                          {group.courses.map((c) => {
                            const courseMet = planCodes.has(c.code);
                            return (
                              <span
                                key={c.id}
                                onClick={() => scrollToCourse(c.code)}
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors ${
                                  courseMet
                                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                }`}
                              >
                                {courseMet && <Check className="w-3 h-3" />}
                                {c.code}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {requirementGroups.length === 0 && planItems.length === 0 && (
                  <p className="text-sm text-slate-400">Add courses to your plan, then save.</p>
                )}
              </div>

              {/* Plan list + Save */}
              <div className="shrink-0 w-56 flex flex-col gap-2">
                <p className="text-sm font-medium text-slate-700">
                  Your Plan{planItems.length > 0 ? ` (${planItems.length})` : ""}
                </p>
                <p className="text-sm font-medium text-slate-700">
                  Expected GPA{planGrades.length > 0 ? ` ${(planGrades.reduce((sum, current) => sum + current, 0) / planGrades.length).toFixed(2)}` : "—"}
                </p>
                {planItems.length === 0 ? (
                  <p className="text-xs text-slate-400">No classes added yet.</p>
                ) : (
                  <ul className="space-y-1 max-h-52 overflow-y-auto pr-1">
                    {planItems.map((item) => (
                      <li
                        key={`${item.code}-${item.instructor}`}
                        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 bg-slate-50 border border-slate-100"
                      >
                        <span className="text-xs font-semibold text-slate-700 shrink-0">{item.code}</span>
                        <span className="text-xs text-slate-400 truncate flex-1">{item.instructor}</span>
                        <button
                          onClick={() => handleRemoveFromPlan(item.code, item.instructor)}
                          className="shrink-0 text-slate-300 hover:text-rose-500 transition-colors"
                          aria-label={`Remove ${item.code}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <button
                  onClick={openSaveModal}
                  disabled={!canSave}
                  title={!canSave && requirementGroups.length > 0 ? "Complete all requirement sections to enable saving" : undefined}
                  className="mt-1 flex items-center gap-2 px-5 py-2.5 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full hover:bg-emerald-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed self-start"
                >
                  <Save className="w-4 h-4" />
                  Save Plan
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <KpiCard
              title="Average Course GPA"
              value={avgGpa > 0 ? avgGpa.toFixed(2) : "—"}
              subtitle={`Across ${displayedCourses.length} courses`}
            />
            <KpiCard
              title="Total Courses"
              value={String(displayedCourses.length)}
              subtitle={selectedSubject ? `Major: ${majorLabel}` : "All subjects"}
            />
          </div>

          <div className="space-y-6">
            <h2 className="text-slate-900">Grade Distributions by Course</h2>

            {loading && (
              <p className="text-slate-500 text-sm">Loading courses…</p>
            )}

            {error && (
              <p className="text-rose-600 text-sm">
                Could not reach the API server. Make sure <code>make dev-be</code> is running.
              </p>
            )}

            {!loading && !error && displayedCourses.length === 0 && (
              <p className="text-slate-500 text-sm">No courses match the current filters.</p>
            )}

            {displayedCourses.map((course) => (
              <CourseCard
                key={course.code}
                code={course.code}
                name={course.name}
                avgGpa={course.avgGpa}
                gradeData={course.gradeData}
                instructors={selectedInstructor ? [selectedInstructor] : []}
                showInstructors={true}
                isRequired={requiredCodes.has(course.code)}
                planItems={planItems}
                onAddToPlan={handleAddToPlan}
              />
            ))}
          </div>
        </div>
      </main>
    </div>

    {/* Save Plan modal */}
    {showSaveModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
          <h2 className="text-slate-900 mb-1">Save Plan</h2>
          <p className="text-sm text-slate-500 mb-5">
            Saves {planItems.length} selected course{planItems.length !== 1 ? "s" : ""} to My Degree Plan.
          </p>
          <label className="block text-sm font-medium text-slate-700 mb-1">Plan name</label>
          <input
            type="text"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-5"
            autoFocus
          />
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowSaveModal(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!planName.trim()}
              className="px-5 py-2 text-sm text-white rounded-lg btn-forest disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Saved confirmation toast */}
    {savedConfirm && (
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-700 text-white text-sm px-4 py-3 rounded-xl shadow-lg">
        <Save className="w-4 h-4" />
        Plan saved — view it in <a href="/saved-plans" className="underline font-medium">My Degree Plan</a>
      </div>
    )}
    </>
  );
}
