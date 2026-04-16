"use client";

import { useState } from "react";
import { Download, Save } from "lucide-react";
import * as Switch from "@radix-ui/react-switch";

import { CourseCard } from "../components/course-card";
import { FilterSidebar } from "../components/filter-sidebar";
import { KpiCard } from "../components/kpi-card";

export default function DashboardPage() {
  const [selectedYears, setSelectedYears] = useState<string[]>(["AY23"]);
  const [selectedMajor, setSelectedMajor] = useState<string>("Computer Science");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"all" | "specific">("all");
  const [specificInstructor, setSpecificInstructor] = useState<string>("");

  const courses = [
    {
      code: "CS 210",
      name: "Computer Science I",
      subject: "CS",
      number: 210,
      avgGpa: 3.72,
      instructorRating: 4.5,
      instructors: ["Smith, J.", "Johnson, A."],
      gradeData: [
        { grade: "A", count: 145, percentage: 58.2 },
        { grade: "B", count: 68, percentage: 27.3 },
        { grade: "C", count: 23, percentage: 9.2 },
        { grade: "DNF", count: 12, percentage: 5.3 },
      ],
    },
    {
      code: "CS 313",
      name: "Data Structures",
      subject: "CS",
      number: 313,
      avgGpa: 3.21,
      instructorRating: 4.2,
      instructors: ["Brown, K."],
      gradeData: [
        { grade: "A", count: 98, percentage: 37.2 },
        { grade: "B", count: 102, percentage: 38.7 },
        { grade: "C", count: 45, percentage: 17.1 },
        { grade: "DNF", count: 18, percentage: 7.0 },
      ],
    },
    {
      code: "CS 415",
      name: "Operating Systems",
      subject: "CS",
      number: 415,
      avgGpa: 2.38,
      instructorRating: 3.8,
      instructors: ["Davis, M."],
      gradeData: [
        { grade: "A", count: 42, percentage: 17.3 },
        { grade: "B", count: 78, percentage: 32.1 },
        { grade: "C", count: 89, percentage: 36.6 },
        { grade: "DNF", count: 34, percentage: 14.0 },
      ],
    },
    {
      code: "CS 422",
      name: "Software Engineering",
      subject: "CS",
      number: 422,
      avgGpa: 3.65,
      instructorRating: 4.7,
      instructors: ["Wilson, T.", "Smith, J."],
      gradeData: [
        { grade: "A", count: 128, percentage: 53.6 },
        { grade: "B", count: 72, percentage: 30.1 },
        { grade: "C", count: 31, percentage: 13.0 },
        { grade: "DNF", count: 8, percentage: 3.3 },
      ],
    },
  ];

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesInstructor =
      viewMode !== "specific" ||
      specificInstructor === "" ||
      course.instructors.includes(specificInstructor);

    return matchesSearch && matchesInstructor;
  });

  const avgGpa = filteredCourses.length
    ? filteredCourses.reduce((sum, course) => sum + course.avgGpa, 0) / filteredCourses.length
    : 0;
  const avgRating = filteredCourses.length
    ? filteredCourses.reduce((sum, course) => sum + course.instructorRating, 0) / filteredCourses.length
    : 0;

  const handleSavePlan = () => {
    window.alert("Plan saved! (Connect to SQLite to persist)");
  };

  return (
    <div className="flex flex-col lg:min-h-[calc(100vh-88px)] lg:flex-row">
      <FilterSidebar
        selectedYears={selectedYears}
        onYearsChange={setSelectedYears}
        selectedMajor={selectedMajor}
        onMajorChange={setSelectedMajor}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl p-6 md:p-8">
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <label className="flex items-center gap-3 text-sm text-slate-700">
                <span className="font-medium">View Mode:</span>
                <div className="flex flex-wrap items-center gap-2">
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

              {viewMode === "specific" && (
                <select
                  value={specificInstructor}
                  onChange={(event) => setSpecificInstructor(event.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select Instructor...</option>
                  <option value="Smith, J.">Smith, J.</option>
                  <option value="Johnson, A.">Johnson, A.</option>
                  <option value="Brown, K.">Brown, K.</option>
                  <option value="Davis, M.">Davis, M.</option>
                  <option value="Wilson, T.">Wilson, T.</option>
                </select>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleSavePlan}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white transition-colors hover:bg-emerald-700"
              >
                <Save className="w-4 h-4" />
                Save Plan
              </button>
              <button className="flex items-center gap-2 rounded-lg bg-forest-900 px-4 py-2 text-white transition-colors hover:bg-forest-800">
                <Download className="w-4 h-4" />
                Export Report
              </button>
            </div>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
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

          <div className="space-y-6">
            <h2 className="text-slate-900">Grade Distributions by Course</h2>
            <p className="-mt-4 text-sm text-slate-600">
              Showing data for {selectedYears.join(", ")} • Percentages calculated from total student enrollment
            </p>
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.code}
                code={course.code}
                name={course.name}
                avgGpa={course.avgGpa}
                instructorRating={course.instructorRating}
                gradeData={course.gradeData}
                instructors={course.instructors}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
