"use client";

import { useEffect, useRef, useState } from "react";
import { FilterSidebar } from "./components/filter-sidebar";
import { CourseCard } from "./components/course-card";
import { Check, CheckCircle2, Circle, Save, X, Sparkles, Loader2, ArrowUpDown } from "lucide-react";
import { savePlan, getDraftItems, addDraftItem, removeDraftItem, clearDraft } from "./lib/saved-plans";
import type { PlanItem } from "./lib/saved-plans";
import { isGroupMet, allGroupsMet, groupBySequence } from "./lib/requirements";
import type { RequirementGroup } from "./lib/requirements";

interface UpgradeSuggestion {
  code: string;
  currentInstructor: string;
  currentGpa: number;
  betterItem: PlanItem;
}

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

type SortOrder = "default" | "gpa-asc" | "gpa-desc" | "students-asc" | "students-desc" | "name-asc" | "name-desc";

const MAJOR_LABELS: Record<string, string> = {
  CS:   "Computer Science",
  MATH: "Mathematics",
  BA:   "Business",
};

const courseCache = new Map<string, Course[]>();

export default function DashboardPage() {
  "use no memo";
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("CS");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedInstructor, setSelectedInstructor] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("default");
  const [instructors, setInstructors] = useState<string[]>([]);
  const [planGrades, setPlanGrades] = useState<number[]>([]);

  const [courses, setCourses] = useState<Course[]>([]);
  const [requirementGroups, setRequirementGroups] = useState<RequirementGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [planName, setPlanName] = useState("");
  const [savedConfirm, setSavedConfirm] = useState(false);
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [highlightedCode, setHighlightedCode] = useState<string | null>(null);
  const [upgradeSuggestions, setUpgradeSuggestions] = useState<UpgradeSuggestion[]>([]);
  const [scrolledDown, setScrolledDown] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const draft = getDraftItems(selectedSubject);
    setPlanItems(draft);
    setPlanGrades(draft.map((x) => x.avgGpa));
  }, [selectedSubject]);

  useEffect(() => {
    if (planItems.length === 0) {
      setUpgradeSuggestions([]);
      return;
    }
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
      })
      .catch(() => setUpgradeSuggestions([]));
  }, [planItems]);

  useEffect(() => {
    if (!selectedSubject) return;
    fetch(`/api/requirements?major=${selectedSubject}`)
      .then((r) => r.json())
      .then((data: RequirementGroup[]) => setRequirementGroups(data))
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

  const handleClearPlan = () => {
    clearDraft(selectedSubject);
    setPlanItems([]);
    setPlanGrades([]);
  };

  const handleSwap = (code: string, currentInstructor: string, betterItem: PlanItem) => {
    removeDraftItem(code, currentInstructor, selectedSubject);
    const updated = addDraftItem(betterItem, selectedSubject);
    setPlanItems(updated);
    setPlanGrades(updated.map((x) => x.avgGpa));
  };

  const handleSwapAll = () => {
    let updated: PlanItem[] = planItems;
    for (const s of upgradeSuggestions) {
      removeDraftItem(s.code, s.currentInstructor, selectedSubject);
      updated = addDraftItem(s.betterItem, selectedSubject);
    }
    setPlanItems(updated);
    setPlanGrades(updated.map((x) => x.avgGpa));
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

      // Preserve manual selections — generate only fills in what isn't already chosen
      const existingByCode = new Map<string, PlanItem>();
      for (const item of planItems) {
        existingByCode.set(item.code, item);
      }

      const newPlan: PlanItem[] = [];
      const addedCodes = new Set<string>();

      for (const group of requirementGroups) {
        if (group.type === "all") {
          for (const c of group.courses) {
            if (!addedCodes.has(c.code)) {
              const item = existingByCode.get(c.code) ?? bestInstructors[c.code];
              if (item) {
                newPlan.push({ ...item, code: c.code });
                addedCodes.add(c.code);
              }
            }
          }
        } else if (group.type === "choose_from") {
          const existingChoice = group.courses.find(c => existingByCode.has(c.code));
          if (existingChoice && !addedCodes.has(existingChoice.code)) {
            newPlan.push(existingByCode.get(existingChoice.code)!);
            addedCodes.add(existingChoice.code);
          } else {
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
          }
        } else if (group.type === "one_sequence") {
          const sequences = groupBySequence(group.courses);

          // If the user already has all courses of a complete sequence, keep it
          let existingSeq: PlanItem[] | null = null;
          for (const [, seqCourses] of Object.entries(sequences)) {
            if (seqCourses.every(c => existingByCode.has(c.code))) {
              existingSeq = seqCourses.map(c => existingByCode.get(c.code)!);
              break;
            }
          }

          if (existingSeq) {
            for (const item of existingSeq) {
              if (!addedCodes.has(item.code)) {
                newPlan.push(item);
                addedCodes.add(item.code);
              }
            }
          } else {
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

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const onScroll = () => setScrolledDown(el.scrollTop > 0);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const requiredCodes = new Set(requirementGroups.flatMap((g) => g.courses.map((c) => c.code)));

  const scrollToCourse = (code: string) => {
    const element = document.getElementById(`course-${code.replace(/\s+/g, "-")}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedCode(code);
      setTimeout(() => setHighlightedCode(null), 3000);
    }
  };

  const scrollToTop = () => {
    mainRef.current?.scrollTo({ top: 0, behavior: "instant" });
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

  const filteredCourses = courses
    .filter((c) => {
      const matchesDivision = c.code.startsWith(selectedSubject + " ") || requiredCodes.has(c.code);
      return matchesDivision;
    })
    .sort((a, b) => courseOrder(a) - courseOrder(b));

  const avgGpa =
    filteredCourses.length > 0
      ? filteredCourses.reduce((sum, c) => sum + c.avgGpa, 0) / filteredCourses.length
      : 0;

  const getStudentCount = (c: Course) => (c.gradeData || []).reduce((sum, g) => sum + g.count, 0);

  const sortFn = (a: Course, b: Course) => {
    if (sortOrder === "gpa-asc") return a.avgGpa - b.avgGpa;
    if (sortOrder === "gpa-desc") return b.avgGpa - a.avgGpa;
    if (sortOrder === "students-asc") return getStudentCount(a) - getStudentCount(b);
    if (sortOrder === "students-desc") return getStudentCount(b) - getStudentCount(a);
    if (sortOrder === "name-asc") return (parseInt(a.code.split(" ")[1]) || 0) - (parseInt(b.code.split(" ")[1]) || 0);
    if (sortOrder === "name-desc") return (parseInt(b.code.split(" ")[1]) || 0) - (parseInt(a.code.split(" ")[1]) || 0);
    return courseOrder(a) - courseOrder(b);
  };

  const lowerDivReqs = filteredCourses
    .filter(c => requiredCodes.has(c.code) && parseInt(c.code.split(" ")[1]) < 300)
    .sort(sortFn);
  const upperDivReqs = filteredCourses
    .filter(c => requiredCodes.has(c.code) && parseInt(c.code.split(" ")[1]) >= 300)
    .sort(sortFn);
  const otherCourses = filteredCourses
    .filter(c => !requiredCodes.has(c.code))
    .sort(sortFn);

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

      <main ref={mainRef} className="flex-1 overflow-auto">
        <div id="report-content" className="p-8 max-w-7xl mx-auto">

          {/* Requirements checklist + Save Plan */}
          <div id="requirements-section" className="mb-6 rounded-xl border border-slate-200 bg-white print:hidden">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start p-5">
              {/* Groups */}
              <div className="flex-1 space-y-4">
                {requirementGroups.length > 0 && (
                  <p className="text-sm font-medium text-slate-700">
                    {majorLabel} Requirements — {metGroupCount}/{requirementGroups.length} sections complete
                  </p>
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

                {upgradeSuggestions.length > 0 && (
                  <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Better options available</p>
                      <button
                        onClick={handleSwapAll}
                        className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 transition-colors"
                      >
                        Swap All
                      </button>
                    </div>
                    {upgradeSuggestions.map((s) => (
                      <div key={s.code} className="flex items-center gap-2 text-xs text-amber-800">
                        <span className="font-semibold shrink-0">{s.code}</span>
                        <span className="text-amber-600 truncate">{s.currentInstructor} ({s.currentGpa.toFixed(2)})</span>
                        <span className="shrink-0 text-amber-400">→</span>
                        <span className="truncate flex-1">{s.betterItem.instructor} <span className="font-semibold text-emerald-700">({s.betterItem.avgGpa.toFixed(2)})</span></span>
                        <button
                          onClick={() => handleSwap(s.code, s.currentInstructor, s.betterItem)}
                          className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 transition-colors"
                        >
                          Swap
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Plan list + Save */}
              <div className="shrink-0 w-80 flex flex-col gap-3 border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-5">
                {/* Header row */}
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-semibold text-slate-700">
                    Your Plan{planItems.length > 0 ? ` (${planItems.length})` : ""}
                  </p>
                  <p className="text-xs text-slate-500">
                    Avg GPA: <span className="font-semibold text-slate-700">{planGrades.length > 0 ? (planGrades.reduce((sum, current) => sum + current, 0) / planGrades.length).toFixed(2) : "—"}</span>
                  </p>
                </div>

                {/* Course list */}
                {planItems.length === 0 ? (
                  <p className="text-xs text-slate-400">No classes added yet.</p>
                ) : (
                  <ul className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                    {planItems.map((item) => (
                      <li
                        key={`${item.code}-${item.instructor}`}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 bg-slate-50 border border-slate-100"
                      >
                        <span className="text-xs font-semibold text-slate-700 shrink-0">{item.code}</span>
                        <span className="text-xs text-slate-400 truncate flex-1">{item.instructor}</span>
                        <span className="text-xs font-medium text-slate-500 shrink-0">{item.avgGpa.toFixed(2)}</span>
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

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {requirementGroups.length > 0 && (
                    <button
                      onClick={handleGeneratePlan}
                      disabled={generating}
                      className="relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 shadow-md shadow-violet-500/30 hover:brightness-110 active:scale-[0.97] transition-all duration-200 disabled:opacity-50 disabled:shadow-none disabled:active:scale-100 overflow-hidden group"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-violet-400/20 via-transparent to-indigo-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full" />
                      {generating ? (
                        <Loader2 className="w-4 h-4 animate-spin relative z-10" />
                      ) : (
                        <Sparkles className="w-4 h-4 relative z-10 group-hover:rotate-12 transition-transform duration-200" />
                      )}
                      <span className="relative z-10">Generate Plan</span>
                    </button>
                  )}
                  <button
                    onClick={openSaveModal}
                    disabled={!canSave}
                    title={!canSave && requirementGroups.length > 0 ? "Complete all requirement sections to enable saving" : undefined}
                    className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white btn-forest disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    Save Plan
                  </button>
                  {planItems.length > 0 && (
                    <button
                      onClick={handleClearPlan}
                      className="rounded-full px-4 py-2 text-sm font-medium text-rose-600 border border-rose-200 hover:bg-rose-50 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <h2 className="text-slate-900">Grade Distributions by Course</h2>
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full border border-slate-200 print:hidden">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                    className="bg-transparent text-xs font-semibold text-slate-600 focus:outline-none cursor-pointer"
                  >
                    <option value="default">Default Sort</option>
                    <option value="name-asc">Course Number: Low to High</option>
                    <option value="name-desc">Course Number: High to Low</option>
                    <option value="gpa-asc">GPA: Low to High</option>
                    <option value="gpa-desc">GPA: High to Low</option>
                    <option value="students-desc">Students: High to Low</option>
                    <option value="students-asc">Students: Low to High</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="bg-slate-100 px-3 py-1.5 rounded-full text-slate-600">
                  Avg GPA: <span className="font-bold text-slate-900">{avgGpa > 0 ? avgGpa.toFixed(2) : "—"}</span>
                </div>
                <div className="bg-slate-100 px-3 py-1.5 rounded-full text-slate-600">
                  Total Courses: <span className="font-bold text-slate-900">{filteredCourses.length}</span>
                </div>
              </div>
            </div>

            {loading && (
              <p className="text-slate-500 text-sm">Loading courses…</p>
            )}

            {error && (
              <p className="text-rose-600 text-sm">
                Could not reach the API server. Make sure <code>make dev-be</code> is running.
              </p>
            )}

            {!loading && !error && filteredCourses.length === 0 && (
              <p className="text-slate-500 text-sm">No courses match the current filters.</p>
            )}

            {!loading && !error && filteredCourses.length > 0 && (
              <div className="space-y-16">
                {lowerDivReqs.length > 0 && (
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-px flex-1 bg-slate-200"></div>
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Lower-Division Requirements</h3>
                      <div className="h-px flex-1 bg-slate-200"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {lowerDivReqs.map((course) => (
                        <CourseCard
                          key={course.code}
                          code={course.code}
                          name={course.name}
                          avgGpa={course.avgGpa}
                          gradeData={course.gradeData}
                          instructors={selectedInstructor ? [selectedInstructor] : []}
                          showInstructors={true}
                          isRequired={true}
                          planItems={planItems}
                          isHighlighted={highlightedCode === course.code}
                          onAddToPlan={handleAddToPlan}
                          onSwapInPlan={(newItem) => {
                            const current = planItems.find((i) => i.code === newItem.code);
                            if (current) handleSwap(newItem.code, current.instructor, newItem);
                          }}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {upperDivReqs.length > 0 && (
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-px flex-1 bg-slate-200"></div>
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Upper-Division Requirements</h3>
                      <div className="h-px flex-1 bg-slate-200"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {upperDivReqs.map((course) => (
                        <CourseCard
                          key={course.code}
                          code={course.code}
                          name={course.name}
                          avgGpa={course.avgGpa}
                          gradeData={course.gradeData}
                          instructors={selectedInstructor ? [selectedInstructor] : []}
                          showInstructors={true}
                          isRequired={true}
                          planItems={planItems}
                          isHighlighted={highlightedCode === course.code}
                          onAddToPlan={handleAddToPlan}
                          onSwapInPlan={(newItem) => {
                            const current = planItems.find((i) => i.code === newItem.code);
                            if (current) handleSwap(newItem.code, current.instructor, newItem);
                          }}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {otherCourses.length > 0 && (
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-px flex-1 bg-slate-200"></div>
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Other Courses</h3>
                      <div className="h-px flex-1 bg-slate-200"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {otherCourses.map((course) => (
                        <CourseCard
                          key={course.code}
                          code={course.code}
                          name={course.name}
                          avgGpa={course.avgGpa}
                          gradeData={course.gradeData}
                          instructors={selectedInstructor ? [selectedInstructor] : []}
                          showInstructors={true}
                          isRequired={false}
                          planItems={planItems}
                          isHighlighted={highlightedCode === course.code}
                          onAddToPlan={handleAddToPlan}
                          onSwapInPlan={(newItem) => {
                            const current = planItems.find((i) => i.code === newItem.code);
                            if (current) handleSwap(newItem.code, current.instructor, newItem);
                          }}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
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
              className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!planName.trim()}
              className="rounded-full px-4 py-2 text-sm font-medium text-white btn-forest disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Back to top button */}
    {scrolledDown && (
      <button
        onClick={scrollToTop}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium bg-white border border-slate-200 shadow-lg text-slate-700 hover:bg-slate-50 transition-colors"
      >
        ↑ Back to requirements
      </button>
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
