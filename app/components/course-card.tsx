import { GradeDistributionChart } from "./grade-distribution-chart";
import { Star, TrendingUp, TrendingDown, Users } from "lucide-react";

interface CourseCardProps {
  code: string;
  name: string;
  avgGpa: number;
  instructorRating: number;
  gradeData: { grade: string; count: number; percentage: number }[];
  instructors?: string[];
}

const RECOMMENDATION_STYLES = {
  emerald: "bg-emerald-100 text-emerald-700",
  rose: "bg-rose-100 text-rose-700",
  slate: "bg-slate-100 text-slate-700",
} as const;

type RecommendationColor = keyof typeof RECOMMENDATION_STYLES;

export function CourseCard({
  code,
  name,
  avgGpa,
  instructorRating,
  gradeData,
  instructors = [],
}: CourseCardProps) {
  const getRecommendation = (gpa: number): { label: string; color: RecommendationColor; icon: React.ComponentType<{ className?: string }> | null } => {
    if (gpa > 3.5) return { label: "Seek", color: "emerald", icon: TrendingUp };
    if (gpa < 2.5) return { label: "Avoid", color: "rose", icon: TrendingDown };
    return { label: "Neutral", color: "slate", icon: null };
  };

  const recommendation = getRecommendation(avgGpa);
  const RecommendationIcon = recommendation.icon;
  const totalStudents = gradeData.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="mb-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-slate-900">{code}</h3>
              {RecommendationIcon && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                    RECOMMENDATION_STYLES[recommendation.color]
                  }`}
                >
                  <RecommendationIcon className="w-3 h-3" />
                  {recommendation.label}
                </span>
              )}
            </div>
            <p className="mb-2 text-slate-600">{name}</p>
            {instructors.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Users className="w-4 h-4" />
                <span>{instructors.join(", ")}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-6 lg:ml-6 lg:justify-end">
            <div className="text-right">
              <p className="text-sm text-slate-600 mb-1">Average GPA</p>
              <p
                className={`text-2xl font-semibold ${
                  avgGpa > 3.5
                    ? "text-emerald-600"
                    : avgGpa < 2.5
                    ? "text-rose-600"
                    : "text-slate-900"
                }`}
              >
                {avgGpa.toFixed(2)}
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm text-slate-600 mb-1">Instructor</p>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <p className="text-2xl font-semibold text-slate-900">{instructorRating.toFixed(1)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="text-sm text-slate-700">Grade Distribution</h4>
            <p className="text-xs text-slate-600">{totalStudents} total students</p>
          </div>
          <GradeDistributionChart data={gradeData} courseId={code} />
          <p className="mt-2 text-center text-xs text-slate-500">
            Percentages calculated from all students (not averages of class averages)
          </p>
        </div>
      </div>
    </div>
  );
}
