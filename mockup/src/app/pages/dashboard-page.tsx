import { useState } from "react";
import { FilterSidebar } from "../components/filter-sidebar";
import { KpiCard } from "../components/kpi-card";
import { GradeDistributionChart } from "../components/grade-distribution-chart";
import { CourseCard } from "../components/course-card";
import { Download } from "lucide-react";
import * as Switch from "@radix-ui/react-switch";

export function DashboardPage() {
  const [selectedYear, setSelectedYear] = useState<string>("AY23");
  const [selectedMajor, setSelectedMajor] = useState<string>("Computer Science");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"all" | "specific">("all");

  // Mock course data
  const courses = [
    {
      code: "CS 210",
      name: "Computer Science I",
      avgGpa: 3.72,
      instructorRating: 4.5,
      gradeData: [
        { grade: "A", count: 145 },
        { grade: "B", count: 68 },
        { grade: "C", count: 23 },
        { grade: "DNF", count: 12 },
      ],
    },
    {
      code: "CS 313",
      name: "Data Structures",
      avgGpa: 3.21,
      instructorRating: 4.2,
      gradeData: [
        { grade: "A", count: 98 },
        { grade: "B", count: 102 },
        { grade: "C", count: 45 },
        { grade: "DNF", count: 18 },
      ],
    },
    {
      code: "CS 415",
      name: "Operating Systems",
      avgGpa: 2.38,
      instructorRating: 3.8,
      gradeData: [
        { grade: "A", count: 42 },
        { grade: "B", count: 78 },
        { grade: "C", count: 89 },
        { grade: "DNF", count: 34 },
      ],
    },
    {
      code: "CS 422",
      name: "Software Engineering",
      avgGpa: 3.65,
      instructorRating: 4.7,
      gradeData: [
        { grade: "A", count: 128 },
        { grade: "B", count: 72 },
        { grade: "C", count: 31 },
        { grade: "DNF", count: 8 },
      ],
    },
  ];

  const filteredCourses = courses.filter((course) =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const avgGpa = courses.reduce((sum, c) => sum + c.avgGpa, 0) / courses.length;
  const avgRating = courses.reduce((sum, c) => sum + c.instructorRating, 0) / courses.length;

  return (
    <div className="flex h-[calc(100vh-80px)]">
      {/* Sidebar */}
      <FilterSidebar
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        selectedMajor={selectedMajor}
        onMajorChange={setSelectedMajor}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto">
          {/* Controls Bar */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-3 text-sm text-slate-700">
                <span className="font-medium">View Mode:</span>
                <div className="flex items-center gap-2">
                  <span className={viewMode === "all" ? "text-forest-900 font-semibold" : "text-slate-500"}>
                    All Instructors
                  </span>
                  <Switch.Root
                    checked={viewMode === "specific"}
                    onCheckedChange={(checked) => setViewMode(checked ? "specific" : "all")}
                    className="w-11 h-6 bg-slate-300 rounded-full relative data-[state=checked]:bg-emerald-600 transition-colors"
                  >
                    <Switch.Thumb className="block w-5 h-5 bg-white rounded-full shadow-md transform transition-transform translate-x-0.5 data-[state=checked]:translate-x-[22px]" />
                  </Switch.Root>
                  <span className={viewMode === "specific" ? "text-forest-900 font-semibold" : "text-slate-500"}>
                    Specific Teacher
                  </span>
                </div>
              </label>
            </div>

            <button className="flex items-center gap-2 px-4 py-2 bg-forest-900 text-white rounded-lg hover:bg-forest-800 transition-colors">
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <KpiCard
              title="Average Course GPA"
              value={avgGpa.toFixed(2)}
              subtitle={`Across ${filteredCourses.length} courses`}
            />
            <KpiCard
              title="Average Instructor Rating"
              value={avgRating.toFixed(1)}
              subtitle="Out of 5.0"
            />
          </div>

          {/* Course Cards Grid */}
          <div className="space-y-6">
            <h2 className="text-slate-900">Grade Distributions by Course</h2>
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.code}
                code={course.code}
                name={course.name}
                avgGpa={course.avgGpa}
                instructorRating={course.instructorRating}
                gradeData={course.gradeData}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
