"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { CsvUploadZone } from "../components/csv-upload-zone";
import type { RequirementGroup } from "../lib/requirements";

const MAJORS = [
  { key: "CS",   label: "Computer Science" },
  { key: "MATH", label: "Mathematics" },
  { key: "BA",   label: "Business" },
] as const;

const SUBJECTS = ["CS", "MATH", "BA"] as const;

type MajorKey = (typeof MAJORS)[number]["key"];

const GROUP_TYPE_LABELS: Record<string, string> = {
  all:           "All required",
  one_sequence:  "Choose one sequence",
  choose_from:   "Choose at least one",
};

interface CourseOption {
  code: string;
  name: string | null;
  subject: string;
  courseNumber: string;
}

interface AddCourseState {
  groupId: number;
  browseSubject: string;
  selectedCourse: string;
  sequenceTag: string;
  options: CourseOption[];
}

export default function AdminPage() {
  const [selectedMajor, setSelectedMajor] = useState<MajorKey>("CS");
  const [groups, setGroups] = useState<RequirementGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  // Add-course state per group
  const [addState, setAddState] = useState<Record<number, AddCourseState>>({});

  // New group form
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupType, setNewGroupType] = useState<string>("all");
  const [addingGroup, setAddingGroup] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/requirements?major=${selectedMajor}`)
      .then((r) => r.json())
      .then((data: RequirementGroup[]) => {
        setGroups(data);
        // auto-expand all groups
        const exp: Record<number, boolean> = {};
        data.forEach((g) => { exp[g.groupId] = true; });
        setExpanded(exp);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedMajor]);

  const fetchCourseOptions = async (groupId: number, subject: string) => {
    const res = await fetch(`/api/courses?subject=${subject}`);
    const data: { code: string; name: string | null }[] = await res.json();
    const options: CourseOption[] = data.map((c) => {
      const parts = c.code.split(" ");
      return { code: c.code, name: c.name, subject: parts[0], courseNumber: parts.slice(1).join(" ") };
    });
    setAddState((prev) => ({
      ...prev,
      [groupId]: { ...(prev[groupId] ?? { sequenceTag: "", selectedCourse: "" }), groupId, browseSubject: subject, options },
    }));
  };

  const openAddCourse = (group: RequirementGroup) => {
    const existing = addState[group.groupId];
    if (existing) return; // already open
    fetchCourseOptions(group.groupId, selectedMajor);
  };

  const closeAddCourse = (groupId: number) => {
    setAddState((prev) => {
      const next = { ...prev };
      delete next[groupId];
      return next;
    });
  };

  const handleSubjectChange = (groupId: number, subject: string) => {
    setAddState((prev) => ({ ...prev, [groupId]: { ...prev[groupId], selectedCourse: "", options: [] } }));
    fetchCourseOptions(groupId, subject);
  };

  const handleAddCourse = async (group: RequirementGroup) => {
    const state = addState[group.groupId];
    if (!state?.selectedCourse) return;
    const opt = state.options.find((c) => c.code === state.selectedCourse);
    if (!opt) return;

    const res = await fetch("/api/requirements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        major: selectedMajor,
        groupId: group.groupId,
        subject: opt.subject,
        courseNumber: opt.courseNumber,
        sequenceTag: state.sequenceTag || null,
      }),
    });
    if (res.ok) {
      const { id } = await res.json();
      setGroups((prev) =>
        prev.map((g) =>
          g.groupId === group.groupId
            ? { ...g, courses: [...g.courses, { id, code: opt.code, name: opt.name, sequenceTag: state.sequenceTag || null }] }
            : g
        )
      );
      setAddState((prev) => ({ ...prev, [group.groupId]: { ...prev[group.groupId], selectedCourse: "", sequenceTag: "" } }));
    }
  };

  const handleRemoveCourse = async (groupId: number, reqId: number) => {
    await fetch(`/api/requirements/${reqId}`, { method: "DELETE" });
    setGroups((prev) =>
      prev.map((g) =>
        g.groupId === groupId ? { ...g, courses: g.courses.filter((c) => c.id !== reqId) } : g
      )
    );
  };

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) return;
    setAddingGroup(true);
    const sortOrder = groups.length > 0 ? Math.max(...groups.map((g) => g.sortOrder)) + 1 : 1;
    const res = await fetch("/api/requirement-groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ major: selectedMajor, groupName: newGroupName.trim(), type: newGroupType, sortOrder }),
    });
    if (res.ok) {
      const { groupId } = await res.json();
      const newGroup: RequirementGroup = { groupId, groupName: newGroupName.trim(), type: newGroupType as RequirementGroup["type"], sortOrder, courses: [] };
      setGroups((prev) => [...prev, newGroup]);
      setExpanded((prev) => ({ ...prev, [groupId]: true }));
      setNewGroupName("");
      setNewGroupType("all");
    }
    setAddingGroup(false);
  };

  const handleDeleteGroup = async (groupId: number) => {
    await fetch(`/api/requirement-groups/${groupId}`, { method: "DELETE" });
    setGroups((prev) => prev.filter((g) => g.groupId !== groupId));
    closeAddCourse(groupId);
  };

  const majorLabel = MAJORS.find((m) => m.key === selectedMajor)?.label ?? selectedMajor;

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-slate-900 mb-2">Admin Portal</h1>
        <p className="text-slate-600">Manage grade data and major requirements</p>
      </div>

      {/* CSV import */}
      <section className="mb-12">
        <h2 className="text-slate-900 mb-2">Import Grade Data</h2>
        <p className="mb-4 text-sm text-slate-600">
          Upload CSV with columns: TERM, TERM_DESC, SUBJ, NUMB, TITLE (optional), CRN, INSTRUCTOR, and grade distribution columns
        </p>
        <CsvUploadZone />
      </section>

      {/* Degree requirements */}
      <section>
        <h2 className="text-slate-900 mb-1">Degree Requirements</h2>
        <p className="mb-6 text-sm text-slate-600">
          Define requirement groups for each major. Students must satisfy all groups before saving a plan.
        </p>

        {/* Major tabs */}
        <div className="mb-6 flex gap-2">
          {MAJORS.map((m) => (
            <button
              key={m.key}
              onClick={() => setSelectedMajor(m.key)}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                selectedMajor === m.key
                  ? "bg-forest-900 text-white"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {loading && <p className="text-sm text-slate-500">Loading…</p>}

        <div className="space-y-4">
          {groups.map((group) => {
            const isExpanded = expanded[group.groupId] ?? false;
            const addingHere = !!addState[group.groupId];
            const state = addState[group.groupId];
            const addedCodes = new Set(group.courses.map((c) => c.code));
            const availableOptions = (state?.options ?? []).filter((c) => !addedCodes.has(c.code));
            const isSeq = group.type === "one_sequence";

            return (
              <div key={group.groupId} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                {/* Group header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
                  <button
                    onClick={() => setExpanded((p) => ({ ...p, [group.groupId]: !isExpanded }))}
                    className="flex items-center gap-2 flex-1 text-left"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    <span className="text-sm font-medium text-slate-900">{group.groupName}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                      {group.courses.length}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      group.type === "all" ? "bg-indigo-100 text-indigo-700"
                      : group.type === "one_sequence" ? "bg-amber-100 text-amber-700"
                      : "bg-teal-100 text-teal-700"
                    }`}>
                      {GROUP_TYPE_LABELS[group.type]}
                    </span>
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(group.groupId)}
                    className="shrink-0 flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-rose-600 border border-rose-200 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete group
                  </button>
                </div>

                {isExpanded && (
                  <>
                    {/* Course list */}
                    <div className="divide-y divide-slate-100">
                      {group.courses.length === 0 && (
                        <p className="px-5 py-4 text-sm text-slate-400 text-center">No courses yet.</p>
                      )}
                      {group.courses.map((c) => (
                        <div key={c.id} className="flex items-center gap-3 px-5 py-2.5">
                          {isSeq && c.sequenceTag && (
                            <span className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                              {c.sequenceTag}
                            </span>
                          )}
                          <span className="flex-1 text-sm font-medium text-slate-900 truncate">
                            {c.code}{c.name ? ` — ${c.name}` : ""}
                          </span>
                          <button
                            onClick={() => handleRemoveCourse(group.groupId, c.id)}
                            className="shrink-0 text-xs font-medium text-rose-500 hover:text-rose-700 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add course toggle / form */}
                    <div className="border-t border-slate-100 bg-slate-50">
                      {!addingHere ? (
                        <button
                          onClick={() => openAddCourse(group)}
                          className="w-full flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Add course to this group
                        </button>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2 px-5 py-3">
                          {/* Subject selector */}
                          <select
                            value={state.browseSubject}
                            onChange={(e) => handleSubjectChange(group.groupId, e.target.value)}
                            className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>

                          {/* Course selector */}
                          <select
                            value={state.selectedCourse}
                            onChange={(e) => setAddState((p) => ({ ...p, [group.groupId]: { ...p[group.groupId], selectedCourse: e.target.value } }))}
                            className="flex-1 min-w-48 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="">Select course…</option>
                            {availableOptions.map((c) => (
                              <option key={c.code} value={c.code}>
                                {c.code}{c.name ? ` — ${c.name}` : ""}
                              </option>
                            ))}
                          </select>

                          {/* Sequence tag (only for one_sequence groups) */}
                          {isSeq && (
                            <input
                              type="text"
                              placeholder="Seq (A/B/C)"
                              maxLength={4}
                              value={state.sequenceTag}
                              onChange={(e) => setAddState((p) => ({ ...p, [group.groupId]: { ...p[group.groupId], sequenceTag: e.target.value.toUpperCase() } }))}
                              className="w-28 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          )}

                          <button
                            onClick={() => handleAddCourse(group)}
                            disabled={!state.selectedCourse}
                            className="rounded-full px-3 py-1.5 text-sm font-medium text-white btn-forest disabled:opacity-50"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => closeAddCourse(group.groupId)}
                            className="px-2 py-1.5 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}

          {/* Add new group */}
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5">
            <p className="text-sm font-medium text-slate-700 mb-3">Add Requirement Group</p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Group name (e.g. Lower-Division Core)"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddGroup()}
                className="flex-1 min-w-56 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <select
                value={newGroupType}
                onChange={(e) => setNewGroupType(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All required</option>
                <option value="one_sequence">Choose one sequence</option>
                <option value="choose_from">Choose at least one</option>
              </select>
              <button
                onClick={handleAddGroup}
                disabled={!newGroupName.trim() || addingGroup}
                className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white btn-forest disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                {addingGroup ? "Adding…" : "Add Group"}
              </button>
            </div>
          </div>
        </div>

        {!loading && groups.length === 0 && (
          <p className="mt-2 text-sm text-slate-400 text-center">
            No requirement groups yet for {majorLabel}. Add one above.
          </p>
        )}
      </section>
    </div>
  );
}
