"use client";

import { useEffect, useState } from "react";
import { GradeDistributionChart } from "./grade-distribution-chart";
import { TrendingUp, TrendingDown, Users, Plus, Check, BookMarked, ArrowLeftRight } from "lucide-react";
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
  isHighlighted?: boolean;
  onAddToPlan?: (item: PlanItem) => void;
  onSwapInPlan?: (newItem: PlanItem) => void;
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
  gradeData,
  instructors = [],
  showInstructors = false,
  isRequired = false,
  planItems = [],
  isHighlighted = false,
  onAddToPlan,
  onSwapInPlan,
}: CourseCardProps) {
  const [topInstructors, setTopInstructors] = useState<InstructorRow[]>([]);

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

  const currentPlanItem = planItems.find((i) => i.code === code);
  const isInPlan = (instructor: string) =>
    currentPlanItem?.instructor === instructor;

  return (
    <div
      id={`course-${code.replace(/\s+/g, "-")}`}
      className={`bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col h-full transition-all duration-500 ${
        isHighlighted
          ? "border-emerald-500 ring-4 ring-emerald-500/20 scale-[1.02] shadow-lg z-10"
          : "border-slate-200 hover:shadow-md"
      }`}
    >
      {/* Chart as "thumbnail" */}
      <div className="bg-slate-50 p-2 h-40 border-b border-slate-100 relative group">
        <GradeDistributionChart data={gradeData} courseId={code} height={160} />
        <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 text-[10px] text-white rounded font-medium z-10">
          {totalStudents} students
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        {/* Header info */}
        <div className="mb-3">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 data-testid="course-card-title" className="text-sm font-bold text-slate-900 leading-tight">
              {code}
              {isRequired && (
                <span title="Required">
                  <BookMarked className="inline w-3.5 h-3.5 ml-1.5 text-indigo-600" />
                </span>
              )}
            </h3>
            <div className={`text-sm font-bold ${gpaColor(avgGpa)} shrink-0`}>
              GPA: {avgGpa.toFixed(2)}
            </div>
          </div>
          {name && <p className="text-xs text-slate-500 line-clamp-1 mb-2">{name}</p>}
          
          <div className="flex flex-wrap gap-1.5">
            {RecommendationIcon && (
              <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${RECOMMENDATION_STYLES[recommendation.color]}`}>
                <RecommendationIcon className="w-2.5 h-2.5" />
                {recommendation.label}
              </span>
            )}
            {instructors.length > 0 && (
              <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                <Users className="w-2.5 h-2.5" />
                <span className="truncate max-w-30">{instructors.join(", ")}</span>
              </div>
            )}
          </div>
        </div>

        {/* Top instructors — more condensed */}
        {showInstructors && topInstructors.length > 0 && (
          <div className="mt-auto pt-3 border-t border-slate-100">
            <div className="space-y-1.5">
              {topInstructors.slice(0, 2).map((row) => {
                const added = isInPlan(row.instructor);
                const newItem = { code, instructor: row.instructor, avgGpa: row.avgGpa, gradeData: row.gradeData };
                const isSwappable = !added && !!currentPlanItem && onSwapInPlan;

                return (
                  <div key={row.instructor} className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-slate-700 truncate">{row.instructor}</p>
                      <p className={`text-[10px] font-bold ${gpaColor(row.avgGpa)}`}>{row.avgGpa.toFixed(2)} GPA</p>
                    </div>

                    {added ? (
                      <span className="shrink-0 flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700">
                        <Check className="w-2.5 h-2.5" /> Added
                      </span>
                    ) : isSwappable ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); onSwapInPlan!(newItem); }}
                        className="shrink-0 flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 transition-colors"
                      >
                        <ArrowLeftRight className="w-2.5 h-2.5" /> Swap
                      </button>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); onAddToPlan?.(newItem); }}
                        className="shrink-0 flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold bg-forest-900 text-white hover:bg-forest-800 transition-colors"
                      >
                        <Plus className="w-2.5 h-2.5" /> Add
                      </button>
                    )}
                  </div>
                );
              })}
              {topInstructors.length > 2 && (
                <p className="text-[10px] text-slate-400 text-center italic">+{topInstructors.length - 2} more instructors</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
