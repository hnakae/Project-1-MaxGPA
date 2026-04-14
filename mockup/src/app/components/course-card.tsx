import { GradeDistributionChart } from "./grade-distribution-chart";
import { Star, TrendingUp, TrendingDown } from "lucide-react";

interface CourseCardProps {
  code: string;
  name: string;
  avgGpa: number;
  instructorRating: number;
  gradeData: { grade: string; count: number }[];
}

export function CourseCard({ code, name, avgGpa, instructorRating, gradeData }: CourseCardProps) {
  const getRecommendation = (gpa: number) => {
    if (gpa > 3.5) return { label: "Seek", color: "emerald", icon: TrendingUp };
    if (gpa < 2.5) return { label: "Avoid", color: "rose", icon: TrendingDown };
    return { label: "Neutral", color: "slate", icon: null };
  };

  const recommendation = getRecommendation(avgGpa);
  const RecommendationIcon = recommendation.icon;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-slate-900">{code}</h3>
              {RecommendationIcon && (
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-${recommendation.color}-100 text-${recommendation.color}-700`}
                >
                  <RecommendationIcon className="w-3 h-3" />
                  {recommendation.label}
                </span>
              )}
            </div>
            <p className="text-slate-600">{name}</p>
          </div>

          <div className="flex gap-6 ml-6">
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

        {/* Chart */}
        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="text-sm text-slate-700 mb-3">Grade Distribution</h4>
          <GradeDistributionChart data={gradeData} courseId={code} />
        </div>
      </div>
    </div>
  );
}