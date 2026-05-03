"use client";

import { useEffect, useState } from "react";
import { BookOpen, Calendar, ChevronDown, Download, Trash2, User } from "lucide-react";
import { getSavedPlans, deletePlan } from "../lib/saved-plans";
import type { SavedPlan } from "../lib/saved-plans";

export default function SavedPlansPage() {
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [exporting, setExporting] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  useEffect(() => {
    setPlans(getSavedPlans());
  }, []);

  const handleDelete = (id: string) => {
    deletePlan(id);
    setPlans(getSavedPlans());
  };

  const handleExport = async (plan: SavedPlan) => {
    setExporting(plan.id);
    const [{ default: jsPDF }, { toCanvas }] = await Promise.all([
      import("jspdf"),
      import("html-to-image"),
    ]);
    const el = document.getElementById(`plan-${plan.id}`);
    if (!el) { setExporting(null); return; }
    const canvas = await toCanvas(el, { pixelRatio: 2 });
    const pdf = new jsPDF("p", "mm", "a4");
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;
    let remaining = imgH;
    let offset = 0;
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, offset, imgW, imgH);
    remaining -= pageH;
    while (remaining > 0) {
      offset -= pageH;
      pdf.addPage();
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, offset, imgW, imgH);
      remaining -= pageH;
    }
    pdf.save(`${plan.planName.replace(/\s+/g, "-").toLowerCase()}.pdf`);
    setExporting(null);
  };

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-8">
      <div className="mb-8">
        <h1 className="mb-2 text-slate-900">My Degree Plans</h1>
        <p className="text-slate-600">Your saved course selections</p>
      </div>

      {plans.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <BookOpen className="mx-auto mb-4 h-16 w-16 text-slate-300" />
          <h3 className="mb-2 text-slate-900">No saved plans yet</h3>
          <p className="mb-6 text-slate-600">
            Search for a course on the dashboard, pick instructors using <strong>Add</strong>, then click <strong>Save Plan</strong>.
          </p>
          <a href="/" className="inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-full btn-forest">
            Go to Dashboard
          </a>
        </div>
      ) : (
        <div className="grid gap-6">
          {plans.map((plan) => {
            const isOpen = expanded.has(plan.id);
            return (
              <div key={plan.id} id={`plan-${plan.id}`} className="rounded-xl border border-slate-200 bg-white shadow-sm">

                {/* Header — always visible, click to toggle */}
                <button
                  onClick={() => toggleExpanded(plan.id)}
                  className="w-full px-6 py-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between text-left"
                >
                  <div>
                    <h3 className="mb-2 text-slate-900">{plan.planName}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {plan.subjectLabel}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(plan.createdDate).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </span>
                      <span className="text-slate-400">
                        {(plan.items ?? []).length} course{(plan.items ?? []).length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-sm text-slate-500 mb-1">Plan Avg GPA</p>
                      <p className={`text-2xl font-semibold ${
                        plan.avgGpa > 3.5 ? "text-emerald-600"
                        : plan.avgGpa < 2.5 ? "text-rose-600"
                        : "text-slate-900"
                      }`}>
                        {plan.avgGpa > 0 ? plan.avgGpa.toFixed(2) : "—"}
                      </p>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {/* Collapsible body */}
                {isOpen && (
                  <div className="px-6 pb-6 border-t border-slate-100">
                    {/* Course-instructor rows */}
                    <div className="mt-5 mb-5 space-y-2">
                      {(plan.items ?? []).map((item) => (
                        <div
                          key={`${item.code}-${item.instructor}`}
                          className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
                        >
                          <span className="font-medium text-sm text-slate-900 w-20 shrink-0">{item.code}</span>
                          <span className="flex items-center gap-1 flex-1 text-sm text-slate-600 truncate">
                            <User className="w-3.5 h-3.5 shrink-0" />
                            {item.instructor}
                          </span>
                          <span className={`text-sm font-semibold shrink-0 ${
                            item.avgGpa > 3.5 ? "text-emerald-600"
                            : item.avgGpa < 2.5 ? "text-rose-600"
                            : "text-slate-700"
                          }`}>
                            {item.avgGpa.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
                      <button
                        onClick={() => handleExport(plan)}
                        disabled={exporting === plan.id}
                        className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white btn-forest disabled:opacity-50"
                      >
                        <Download className="w-4 h-4" />
                        {exporting === plan.id ? "Generating…" : "Export PDF"}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(plan.id); }}
                        className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-rose-600 border border-rose-200 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
