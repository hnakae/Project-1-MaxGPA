"use client";

import { useEffect, useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import * as Accordion from "@radix-ui/react-accordion";

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

  useEffect(() => {
    fetch("/api/academic-years")
      .then((r) => r.json())
      .then((years: string[]) => {
        const sorted = [...years].sort((a, b) => b.localeCompare(a));
        setAcademicYears(sorted);
        onYearsChange(sorted);
      })
      .catch(() => {});
  }, []);

  const handleYearToggle = (year: string) => {
    if (selectedYears.includes(year)) {
      onYearsChange(selectedYears.filter((y) => y !== year));
    } else {
      onYearsChange([...selectedYears, year]);
    }
  };

  return (
    <aside className="w-full shrink-0 border-b border-slate-200 bg-white lg:w-80 lg:border-r lg:border-b-0 print:hidden">
      <div className="p-6">
        <h3 className="text-slate-900 mb-6">Filters</h3>

        <Accordion.Root type="multiple" defaultValue={["year", "subject", "course", "instructor"]} className="space-y-4">

          <Accordion.Item value="subject" className="border border-slate-200 rounded-lg overflow-hidden">
            <Accordion.Header>
              <Accordion.Trigger className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
                <span className="font-medium text-slate-900">Major</span>
                <ChevronDown className="w-5 h-5 text-slate-500 transition-transform group-data-[state=open]:rotate-180" />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="p-4 pt-0 bg-slate-50">
              <div className="space-y-2">
                {MAJORS.map(({ label, subject }) => (
                  <label
                    key={subject}
                    className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-white transition-colors"
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
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="year" className="border border-slate-200 rounded-lg overflow-hidden">
            <Accordion.Header>
              <Accordion.Trigger className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
                <span className="font-medium text-slate-900">Academic Year</span>
                <ChevronDown className="w-5 h-5 text-slate-500 transition-transform group-data-[state=open]:rotate-180" />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="p-4 pt-0 bg-slate-50">
              <label className="flex items-center gap-3 p-2 mb-1 rounded cursor-pointer hover:bg-white transition-colors border-b border-slate-200 pb-3">
                <input
                  type="checkbox"
                  checked={selectedYears.length === academicYears.length && academicYears.length > 0}
                  ref={(el) => {
                    if (el) el.indeterminate = selectedYears.length > 0 && selectedYears.length < academicYears.length;
                  }}
                  onChange={() =>
                    selectedYears.length === academicYears.length
                      ? onYearsChange([])
                      : onYearsChange(academicYears)
                  }
                  className="h-4 w-4 rounded text-emerald-600 accent-emerald-600"
                />
                <span className="text-sm font-medium text-slate-700">All years</span>
              </label>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {academicYears.map((year) => (
                  <label
                    key={year}
                    className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-white transition-colors"
                  >
                    <input
                      type="checkbox"
                      value={year}
                      checked={selectedYears.includes(year)}
                      onChange={() => handleYearToggle(year)}
                      className="h-4 w-4 rounded text-emerald-600 accent-emerald-600"
                    />
                    <span className="text-sm text-slate-700">{year}</span>
                  </label>
                ))}
              </div>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="course" className="border border-slate-200 rounded-lg overflow-hidden">
            <Accordion.Header>
              <Accordion.Trigger className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
                <span className="font-medium text-slate-900">Search Courses</span>
                <ChevronDown className="w-5 h-5 text-slate-500 transition-transform group-data-[state=open]:rotate-180" />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="p-4 pt-0 bg-slate-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. CS 210"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="instructor" className="border border-slate-200 rounded-lg overflow-hidden">
            <Accordion.Header>
              <Accordion.Trigger className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
                <span className="font-medium text-slate-900">Instructor</span>
                <ChevronDown className="w-5 h-5 text-slate-500 transition-transform group-data-[state=open]:rotate-180" />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="p-4 pt-0 bg-slate-50">
              <select
                value={selectedInstructor}
                onChange={(e) => onInstructorChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All instructors</option>
                {instructors.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </Accordion.Content>
          </Accordion.Item>

        </Accordion.Root>
      </div>
    </aside>
  );
}
