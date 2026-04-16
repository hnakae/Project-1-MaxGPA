import { Search, ChevronDown } from "lucide-react";
import * as Accordion from "@radix-ui/react-accordion";

interface FilterSidebarProps {
  selectedYears: string[];
  onYearsChange: (years: string[]) => void;
  selectedMajor: string;
  onMajorChange: (major: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const academicYears = ["AY16", "AY17", "AY18", "AY19", "AY20", "AY21", "AY22", "AY23"];
const majors = ["Computer Science", "Business Administration", "Biology"];

export function FilterSidebar({
  selectedYears,
  onYearsChange,
  selectedMajor,
  onMajorChange,
  searchQuery,
  onSearchChange,
}: FilterSidebarProps) {
  const handleYearToggle = (year: string) => {
    if (selectedYears.includes(year)) {
      onYearsChange(selectedYears.filter((selectedYear) => selectedYear !== year));
      return;
    }

    onYearsChange([...selectedYears, year]);
  };

  return (
    <aside className="w-full shrink-0 border-b border-slate-200 bg-white lg:w-80 lg:border-r lg:border-b-0">
      <div className="p-6">
        <h3 className="text-slate-900 mb-6">Filters</h3>

        <Accordion.Root type="multiple" defaultValue={["year", "major", "course"]} className="space-y-4">
          <Accordion.Item value="year" className="border border-slate-200 rounded-lg overflow-hidden">
            <Accordion.Header>
              <Accordion.Trigger className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
                <span className="font-medium text-slate-900">Academic Year</span>
                <ChevronDown className="w-5 h-5 text-slate-500 transition-transform group-data-[state=open]:rotate-180" />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="p-4 pt-0 bg-slate-50">
              <p className="mb-3 text-xs text-slate-600">Select one or more years (AY16–AY23)</p>
              <div className="space-y-2">
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

          <Accordion.Item value="major" className="border border-slate-200 rounded-lg overflow-hidden">
            <Accordion.Header>
              <Accordion.Trigger className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
                <span className="font-medium text-slate-900">Major</span>
                <ChevronDown className="w-5 h-5 text-slate-500 transition-transform group-data-[state=open]:rotate-180" />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="p-4 pt-0 bg-slate-50">
              <div className="space-y-2">
                {majors.map((major) => (
                  <label
                    key={major}
                    className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-white transition-colors"
                  >
                    <input
                      type="radio"
                      name="major"
                      value={major}
                      checked={selectedMajor === major}
                      onChange={(e) => onMajorChange(e.target.value)}
                      className="w-4 h-4 text-emerald-600 accent-emerald-600"
                    />
                    <span className="text-sm text-slate-700">{major}</span>
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
                  placeholder="Search by code or name..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>
      </div>
    </aside>
  );
}
