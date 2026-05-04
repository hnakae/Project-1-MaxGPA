"use client";

import { Check, CheckCircle2, Circle, Save, X, Sparkles, Loader2 } from "lucide-react";
import { isGroupMet, groupBySequence } from "../lib/requirements";
import type { RequirementGroup } from "../lib/requirements";
import type { PlanItem } from "../lib/saved-plans";

interface UpgradeSuggestion {
  code: string;
  currentInstructor: string;
  currentGpa: number;
  betterItem: PlanItem;
}

interface RequirementsChecklistProps {
  requirementGroups: RequirementGroup[];
  majorLabel: string;
  planCodes: Set<string>;
  planItems: PlanItem[];
  upgradeSuggestions: UpgradeSuggestion[];
  generating: boolean;
  canSave: boolean;
  metGroupCount: number;
  scrollToCourse: (code: string) => void;
  handleSwap: (code: string, currentInstructor: string, betterItem: PlanItem) => void;
  handleSwapAll: () => void;
  handleRemoveFromPlan: (code: string, instructor: string) => void;
  handleGeneratePlan: () => void;
  openSaveModal: () => void;
  handleClearPlan: () => void;
}

export function RequirementsChecklist({
  requirementGroups,
  majorLabel,
  planCodes,
  planItems,
  upgradeSuggestions,
  generating,
  canSave,
  metGroupCount,
  scrollToCourse,
  handleSwap,
  handleSwapAll,
  handleRemoveFromPlan,
  handleGeneratePlan,
  openSaveModal,
  handleClearPlan,
}: RequirementsChecklistProps) {
  const planGrades = planItems.map((x) => x.avgGpa);
  const avgGpa = planGrades.length > 0 
    ? (planGrades.reduce((sum, current) => sum + current, 0) / planGrades.length).toFixed(2) 
    : "—";

  return (
    <div id="requirements-section" className="mb-6 rounded-xl border border-slate-200 bg-white print:hidden">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start p-5">
        {/* Groups */}
        <div className="flex-1 space-y-4">
          {requirementGroups.length > 0 && (
            <p className="text-sm font-medium text-slate-700">
              {majorLabel} Requirements — {metGroupCount}/{requirementGroups.length} sections complete
            </p>
          )}

          {requirementGroups.map((group) => {
            const met = isGroupMet(group, planCodes);
            return (
              <div key={group.groupId}>
                <div className="flex items-center gap-2 mb-2">
                  {met
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    : <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                  }
                  <span className={`text-xs font-semibold uppercase tracking-wide ${met ? "text-emerald-600" : "text-slate-500"}`}>
                    {group.groupName}
                  </span>
                  {group.type === "one_sequence" && (
                    <span className="text-xs text-slate-400">— choose one sequence</span>
                  )}
                  {group.type === "choose_from" && (
                    <span className="text-xs text-slate-400">— choose at least one</span>
                  )}
                </div>

                {group.type === "all" && (
                  <div className="flex flex-wrap gap-1.5 pl-6">
                    {group.courses.map((c) => {
                      const courseMet = planCodes.has(c.code);
                      return (
                        <span
                          key={c.id}
                          onClick={() => scrollToCourse(c.code)}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors ${
                            courseMet
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          }`}
                        >
                          {courseMet ? <Check className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                          {c.code}
                        </span>
                      );
                    })}
                  </div>
                )}

                {group.type === "one_sequence" && (
                  <div className="flex flex-wrap gap-2 pl-6">
                    {Object.entries(groupBySequence(group.courses)).map(([tag, courses], idx, arr) => {
                      const seqMet = courses.every((c) => planCodes.has(c.code));
                      return (
                        <div key={tag} className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border ${
                            seqMet
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-50 text-slate-600"
                          }`}>
                            {seqMet && <Check className="w-3 h-3" />}
                            {courses.map((c, i) => (
                              <span
                                key={c.id}
                                onClick={() => scrollToCourse(c.code)}
                                className="hover:underline cursor-pointer"
                              >
                                {c.code}
                                {i < courses.length - 1 ? " + " : ""}
                              </span>
                            ))}
                          </span>
                          {idx < arr.length - 1 && (
                            <span className="text-xs text-slate-400 font-medium">OR</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {group.type === "choose_from" && (
                  <div className="flex flex-wrap gap-1.5 pl-6">
                    {group.courses.map((c) => {
                      const courseMet = planCodes.has(c.code);
                      return (
                        <span
                          key={c.id}
                          onClick={() => scrollToCourse(c.code)}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors ${
                            courseMet
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          }`}
                        >
                          {courseMet && <Check className="w-3 h-3" />}
                          {c.code}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {requirementGroups.length === 0 && planItems.length === 0 && (
            <p className="text-sm text-slate-400">Add courses to your plan, then save.</p>
          )}

          {planItems.length > 0 && upgradeSuggestions.length > 0 && (
            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Better options available</p>
                <button
                  onClick={handleSwapAll}
                  className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 transition-colors"
                >
                  Swap All
                </button>
              </div>
              {upgradeSuggestions.map((s) => (
                <div key={s.code} className="flex items-center gap-2 text-xs text-amber-800">
                  <span className="font-semibold shrink-0">{s.code}</span>
                  <span className="text-amber-600 truncate">{s.currentInstructor} ({s.currentGpa.toFixed(2)})</span>
                  <span className="shrink-0 text-amber-400">→</span>
                  <span className="truncate flex-1">{s.betterItem.instructor} <span className="font-semibold text-emerald-700">({s.betterItem.avgGpa.toFixed(2)})</span></span>
                  <button
                    onClick={() => handleSwap(s.code, s.currentInstructor, s.betterItem)}
                    className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 transition-colors"
                  >
                    Swap
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Plan list + Save */}
        <div className="shrink-0 w-80 flex flex-col gap-3 border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-5">
          {/* Header row */}
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-semibold text-slate-700">
              Your Plan{planItems.length > 0 ? ` (${planItems.length})` : ""}
            </p>
            <p className="text-xs text-slate-500">
              Avg GPA: <span className="font-semibold text-slate-700">{avgGpa}</span>
            </p>
          </div>

          {/* Course list */}
          {planItems.length === 0 ? (
            <p className="text-xs text-slate-400">No classes added yet.</p>
          ) : (
            <ul className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {planItems.map((item) => (
                <li
                  key={`${item.code}-${item.instructor}`}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 bg-slate-50 border border-slate-100"
                >
                  <span className="text-xs font-semibold text-slate-700 shrink-0">{item.code}</span>
                  <span className="text-xs text-slate-400 truncate flex-1">{item.instructor}</span>
                  <span className="text-xs font-medium text-slate-500 shrink-0">{item.avgGpa.toFixed(2)}</span>
                  <button
                    onClick={() => handleRemoveFromPlan(item.code, item.instructor)}
                    className="shrink-0 text-slate-300 hover:text-rose-500 transition-colors"
                    aria-label={`Remove ${item.code}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {requirementGroups.length > 0 && (
              <button
                onClick={handleGeneratePlan}
                disabled={generating}
                className="relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white bg-linear-to-r from-violet-600 via-purple-600 to-indigo-600 shadow-md shadow-violet-500/30 hover:brightness-110 active:scale-[0.97] transition-all duration-200 disabled:opacity-50 disabled:shadow-none disabled:active:scale-100 overflow-hidden group"
              >
                <span className="absolute inset-0 bg-linear-to-r from-violet-400/20 via-transparent to-indigo-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full" />
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin relative z-10" />
                ) : (
                  <Sparkles className="w-4 h-4 relative z-10 group-hover:rotate-12 transition-transform duration-200" />
                )}
                <span className="relative z-10">Generate Plan</span>
              </button>
            )}
            <button
              onClick={openSaveModal}
              disabled={!canSave}
              title={!canSave && requirementGroups.length > 0 ? "Complete all requirement sections to enable saving" : undefined}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white btn-forest disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              Save Plan
            </button>
            {planItems.length > 0 && (
              <button
                onClick={handleClearPlan}
                className="rounded-full px-4 py-2 text-sm font-medium text-rose-600 border border-rose-200 hover:bg-rose-50 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
