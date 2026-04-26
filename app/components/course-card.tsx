"use client";

import { useEffect, useState } from "react";
import { GradeDistributionChart } from "./grade-distribution-chart";
import { Star, TrendingUp, TrendingDown, Users, Plus, Check, BookMarked, ChevronDown } from "lucide-react";
import type { GradeEntry, PlanItem } from "../lib/saved-plans";

interface InstructorRow {
  instructor: string;
  avgGpa: number;
  gradeData: GradeEntry[];
}

interface CourseCardProps {
  code: string;
  name?: string;
  avgGpa: number;
  instructorRating?: number;
  gradeData: { grade: string; count: number; percentage: number }[];
  instructors?: string[];
  showInstructors?: boolean;
  isRequired?: boolean;
  planItems?: PlanItem[];
  onAddToPlan?: (item: PlanItem) => void;
}

const RECOMMENDATION_STYLES = {
  emerald: "bg-emerald-100 text-emerald-700",
  rose:    "bg-rose-100 text-rose-700",
  slate:   "bg-slate-100 text-slate-700",
} as const;

type RecommendationColor = keyof typeof RECOMMENDATION_STYLES;

function gpaColor(gpa: number) {
  if (gpa > 3.5) return "text-emerald-600";
  if (gpa < 2.5) return "text-rose-600";
  return "text-slate-700";
}

export function CourseCard({
  code,
  name,
  avgGpa,
  instructorRating,
  gradeData,
  instructors = [],
  showInstructors = false,
  isRequired = false,
  planItems = [],
  onAddToPlan,
}: CourseCardProps) {
  const [topInstructors, setTopInstructors] = useState<InstructorRow[]>([]);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!showInstructors) return;
    fetch(`/api/course-instructors?code=${encodeURIComponent(code)}`)
      .then((r) => r.json())
      .then(setTopInstructors)
      .catch(() => {});
  }, [showInstructors, code]);

  const getRecommendation = (gpa: number): { label: string; color: RecommendationColor; icon: React.ComponentType<{ className?: string }> | null } => {
    if (gpa > 3.5) return { label: "Seek",    color: "emerald", icon: TrendingUp };
    if (gpa < 2.5) return { label: "Avoid",   color: "rose",    icon: TrendingDown };
    return           { label: "Neutral", color: "slate",   icon: null };
  };

  const recommendation    = getRecommendation(avgGpa);
  const RecommendationIcon = recommendation.icon;
  const totalStudents      = gradeData.reduce((sum, item) => sum + item.count, 0);

  const isInPlan = (instructor: string) =>
    planItems.some((i) => i.code === code && i.instructor === instructor);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden course-card-print">
      <div className="p-6">
        {/* Header — click to collapse / expand */}
        <div
          className="mb-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between cursor-pointer select-none"
          onClick={() => setCollapsed((c) => !c)}
        >
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-slate-900">
                {code}
                {name && <span className="font-normal text-slate-500"> — {name}</span>}
              </h3>
              {isRequired && (
                <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium bg-indigo-100 text-indigo-700">
                  <BookMarked className="w-3 h-3" />
                  Required
                </span>
              )}
              {RecommendationIcon && (
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${RECOMMENDATION_STYLES[recommendation.color]}`}>
                  <RecommendationIcon className="w-3 h-3" />
                  {recommendation.label}
                </span>
              )}
            </div>
            {instructors.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Users className="w-4 h-4" />
                <span>{instructors.join(", ")}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-start gap-6 lg:ml-6 lg:justify-end">
            <div className="text-right">
              <p className="text-sm text-slate-600 mb-1">Average GPA</p>
              <p className={`text-2xl font-semibold ${gpaColor(avgGpa)}`}>
                {avgGpa.toFixed(2)}
              </p>
            </div>
            {instructorRating !== undefined && (
              <div className="text-right">
                <p className="text-sm text-slate-600 mb-1">Instructor</p>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <p className="text-2xl font-semibold text-slate-900">{instructorRating.toFixed(1)}</p>
                </div>
              </div>
            )}
            <ChevronDown
              className={`w-4 h-4 text-slate-400 mt-1 transition-transform duration-200 ${collapsed ? "-rotate-90" : ""}`}
            />
          </div>
        </div>

        {/* Top instructors */}
        {!collapsed && showInstructors && topInstructors.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-slate-700 mb-3">
              Top {topInstructors.length} Instructors by GPA
            </h4>
            <div className="space-y-2">
              {topInstructors.map((row, i) => {
                const added = isInPlan(row.instructor);
                return (
                  <div
                    key={row.instructor}
                    className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <span className="w-5 text-xs font-medium text-slate-400 shrink-0">
                      {i + 1}.
                    </span>

                    <span className="flex-1 text-sm text-slate-700 truncate">
                      {row.instructor}
                    </span>

                    <span className={`text-sm font-semibold shrink-0 ${gpaColor(row.avgGpa)}`}>
                      {row.avgGpa.toFixed(2)}
                    </span>

                    {/* Mini grade bar */}
                    <div className="hidden sm:flex items-center gap-1 shrink-0">
                      {row.gradeData.map((g) => (
                        <span key={g.grade} className="text-xs text-slate-500">
                          <span className="font-medium">{g.grade}</span> {g.percentage}%
                        </span>
                      )).reduce((acc: React.ReactNode[], el, idx) => (
                        idx === 0 ? [el] : [...acc, <span key={`sep-${idx}`} className="text-slate-300">·</span>, el]
                      ), [])}
                    </div>

                    {onAddToPlan && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!added) {
                            onAddToPlan({ code, instructor: row.instructor, avgGpa: row.avgGpa, gradeData: row.gradeData });
                            setCollapsed(true);
                          }
                        }}
                        className={`shrink-0 flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          added
                            ? "bg-emerald-100 text-emerald-700 cursor-default"
                            : "bg-forest-900 text-white hover:bg-forest-800"
                        }`}
                      >
                        {added ? <><Check className="w-3 h-3" /> Added</> : <><Plus className="w-3 h-3" /> Add</>}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Grade distribution chart */}
        {!collapsed && <div className="bg-slate-50 rounded-lg p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="text-sm text-slate-700">Grade Distribution — All Instructors</h4>
            <p className="text-xs text-slate-600">{totalStudents} total students</p>
          </div>
          <GradeDistributionChart data={gradeData} courseId={code} />
          <p className="mt-2 text-center text-xs text-slate-500">
            Percentages calculated from all students (not averages of class averages)
          </p>
        </div>}
      </div>
    </div>
  );
}
