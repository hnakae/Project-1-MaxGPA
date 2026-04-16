"use client";

import { useState } from "react";
import { BookOpen, Calendar, Download, Trash2 } from "lucide-react";

interface SavedPlan {
  id: number;
  planName: string;
  major: string;
  createdDate: string;
  courses: string[];
  avgGpa: number;
}

export default function SavedPlansPage() {
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([
    {
      id: 1,
      planName: "CS Fall 2024 Plan",
      major: "Computer Science",
      createdDate: "2024-03-15",
      courses: ["CS 210", "CS 313", "CS 415", "CS 422"],
      avgGpa: 3.45,
    },
    {
      id: 2,
      planName: "CS Winter 2025 Plan",
      major: "Computer Science",
      createdDate: "2024-03-20",
      courses: ["CS 210", "CS 313", "CS 314"],
      avgGpa: 3.62,
    },
  ]);

  const handleDelete = (id: number) => {
    setSavedPlans((previous) => previous.filter((plan) => plan.id !== id));
  };

  const handleExport = (_plan: SavedPlan) => {
    // Connect this button to a real export pipeline when saved plans are persisted.
    void _plan;
  };

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-8">
      <div className="mb-8">
        <h1 className="mb-2 text-slate-900">Saved Degree Plans</h1>
        <p className="text-slate-600">View and manage your saved course plans</p>
      </div>

      {savedPlans.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <BookOpen className="mx-auto mb-4 h-16 w-16 text-slate-300" />
          <h3 className="mb-2 text-slate-900">No saved plans yet</h3>
          <p className="mb-6 text-slate-600">Create a degree plan on the main page and save it to see it here.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {savedPlans.map((plan) => (
            <div key={plan.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="mb-1 text-slate-900">{plan.planName}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      {plan.major}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(plan.createdDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm text-slate-600">Plan Avg GPA</p>
                  <p
                    className={`text-2xl font-semibold ${
                      plan.avgGpa > 3.5
                        ? "text-emerald-600"
                        : plan.avgGpa < 2.5
                          ? "text-rose-600"
                          : "text-slate-900"
                    }`}
                  >
                    {plan.avgGpa.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <p className="mb-2 text-sm text-slate-600">Courses ({plan.courses.length})</p>
                <div className="flex flex-wrap gap-2">
                  {plan.courses.map((course) => (
                    <span key={course} className="rounded-lg bg-slate-100 px-3 py-1 text-sm text-slate-700">
                      {course}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
                <button
                  onClick={() => handleExport(plan)}
                  className="flex items-center gap-2 rounded-lg bg-forest-900 px-4 py-2 text-white transition-colors hover:bg-forest-800"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button
                  onClick={() => handleDelete(plan.id)}
                  className="flex items-center gap-2 rounded-lg px-4 py-2 text-rose-600 transition-colors hover:bg-rose-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
