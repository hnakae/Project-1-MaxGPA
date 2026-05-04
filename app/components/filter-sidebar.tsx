"use client";

import { useEffect, useState } from "react";
import { Search, ChevronDown, X } from "lucide-react";

interface FilterSidebarProps {
  selectedYears: string[];
  onYearsChange: (years: string[]) => void;
  selectedSubject: string;
  onSubjectChange: (subject: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  instructors: string[];
  selectedInstructor: string;
  onInstructorChange: (instructor: string) => void;
}

const MAJORS = [
  { label: "Computer Science", subject: "CS" },
  { label: "Mathematics",      subject: "MATH" },
  { label: "Business",         subject: "BA" },
];

export function FilterSidebar({
  selectedYears,
  onYearsChange,
  selectedSubject,
  onSubjectChange,
  searchQuery,
  onSearchChange,
  instructors,
  selectedInstructor,
  onInstructorChange,
}: FilterSidebarProps) {
  const [academicYears, setAcademicYears] = useState<string[]>([]);
  const [yearFrom, setYearFrom] = useState<string>("");
  const [yearTo, setYearTo] = useState<string>("");

  useEffect(() => {
    fetch("/api/academic-years")
      .then((r) => r.json())
      .then((years: string[]) => {
        const sorted = [...years].sort((a, b) => a.localeCompare(b));
        setAcademicYears(sorted);
        if (sorted.length > 0) {
          setYearFrom(sorted[0]);
          setYearTo(sorted[sorted.length - 1]);
          onYearsChange(sorted);
        }
      })
      .catch(() => {});
  }, []);

  const applySpan = (from: string, to: string, allYears: string[]) => {
    onYearsChange(allYears.filter((y) => y >= from && y <= to));
  };

  const handleFromChange = (from: string) => {
    const effectiveTo = yearTo < from ? from : yearTo;
    setYearFrom(from);
    setYearTo(effectiveTo);
    applySpan(from, effectiveTo, academicYears);
  };

  const handleToChange = (to: string) => {
    const effectiveFrom = yearFrom > to ? to : yearFrom;
    setYearFrom(effectiveFrom);
    setYearTo(to);
    applySpan(effectiveFrom, to, academicYears);
  };

  return (
    <aside className="w-full shrink-0 border-b border-slate-200 bg-white lg:w-80 lg:border-r lg:border-b-0 lg:overflow-auto print:hidden">
      <div className="p-6">
        <h3 className="text-slate-900 mb-6">Filters</h3>

        <div className="space-y-4">
          {/* Academic Year Span */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="w-full flex items-center justify-between p-3 bg-white">
              <span className="font-medium text-slate-900">Academic Year</span>
            </div>
            <div className="px-3 pb-3 space-y-2">
              {academicYears.length === 0 ? (
                <p className="text-xs text-slate-400 py-1">Loading…</p>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 mb-1">From</p>
                      <div className="relative">
                        <select
                          value={yearFrom}
                          onChange={(e) => handleFromChange(e.target.value)}
                          className="w-full appearance-none px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          {academicYears.map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 mb-1">To</p>
                      <div className="relative">
                        <select
                          value={yearTo}
                          onChange={(e) => handleToChange(e.target.value)}
                          className="w-full appearance-none px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          {academicYears.map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  {yearFrom && yearTo && (
                    <p className="text-xs text-slate-500 text-center">
                      {yearFrom === yearTo ? yearFrom : `${yearFrom} – ${yearTo}`}
                      {" "}({selectedYears.length} year{selectedYears.length !== 1 ? "s" : ""})
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Major */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="w-full flex items-center justify-between p-3 bg-white">
              <span className="font-medium text-slate-900">Major</span>
            </div>
            <div className="px-3 pb-3">
              <div className="space-y-1">
                {MAJORS.map(({ label, subject }) => (
                  <label
                    key={subject}
                    className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <input
                      type="radio"
                      name="major"
                      value={subject}
                      checked={selectedSubject === subject}
                      onChange={() => onSubjectChange(subject)}
                      className="w-4 h-4 text-emerald-600 accent-emerald-600"
                    />
                    <span className="text-sm text-slate-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Instructor */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="w-full flex items-center justify-between p-3 bg-white">
              <span className="font-medium text-slate-900">Instructor</span>
            </div>
            <div className="px-3 pb-3">
              <div className="relative">
                <select
                  value={selectedInstructor}
                  onChange={(e) => onInstructorChange(e.target.value)}
                  className="w-full appearance-none px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">All Instructors</option>
                  {instructors.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Search Courses */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="w-full flex items-center justify-between p-3 bg-white">
              <span className="font-medium text-slate-900">Search Courses</span>
            </div>
            <div className="px-3 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. CS 422"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => onSearchChange("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
