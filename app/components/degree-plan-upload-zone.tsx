"use client";

// Upload a degree-plan CSV for one major. Required columns: GROUP, GROUP_TYPE, SUBJ, NUMB. Optional: SEQ, TITLE.

import { useState, useRef } from "react";
import { Upload, CheckCircle, AlertCircle, FileText } from "lucide-react";

interface PreviewData {
  columns: string[];
  first_valid_row: Record<string, string>;
  total_courses: number;
}

interface ImportResult {
  major: string;
  groups_created: number;
  courses_inserted: number;
}

interface DegreePlanUploadZoneProps {
  major: string;
  majorLabel: string;
  onImportComplete?: (result: ImportResult) => void;
}

const KEY_FIELDS = ["GROUP", "GROUP_TYPE", "SUBJ", "NUMB", "TITLE"];

type Status = "idle" | "previewing" | "awaiting_confirm" | "importing" | "success" | "error";

export function DegreePlanUploadZone({ major, majorLabel, onImportComplete }: DegreePlanUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const pendingFile = useRef<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStatus("idle");
    setFileName("");
    setPreview(null);
    setImportResult(null);
    setErrorMsg("");
    pendingFile.current = null;
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith(".csv")) loadPreview(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadPreview(file);
  };

  const loadPreview = async (file: File) => {
    pendingFile.current = file;
    setFileName(file.name);
    setStatus("previewing");
    setErrorMsg("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/preview-degree-plan", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `Server error ${res.status}`);
      }
      setPreview(await res.json());
      setStatus("awaiting_confirm");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to read CSV.");
      setStatus("error");
    }
  };

  const handleConfirm = async () => {
    if (!pendingFile.current) return;
    setStatus("importing");

    const formData = new FormData();
    formData.append("file", pendingFile.current);

    try {
      const res = await fetch(`/api/upload-degree-plan?major=${major}`, { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `Server error ${res.status}`);
      }
      const result: ImportResult = await res.json();
      setImportResult(result);
      setStatus("success");
      onImportComplete?.(result);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Import failed.");
      setStatus("error");
    }
  };

  const previewLine = preview
    ? KEY_FIELDS
        .filter((k) => preview.first_valid_row[k] !== undefined)
        .map((k) => `${k}: ${preview.first_valid_row[k]}`)
        .join("  ·  ")
    : "";

  return (
    <div className="space-y-4">
      {(status === "idle" || status === "error") && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-emerald-500 bg-emerald-50"
              : status === "error"
              ? "border-rose-300 bg-rose-50"
              : "border-slate-300 hover:border-slate-400 bg-slate-50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          {status === "error" ? (
            <>
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
              <p className="text-rose-700 font-medium text-sm mb-1">Could not read CSV</p>
              <p className="text-xs text-rose-600 mb-2">{errorMsg}</p>
              <p className="text-xs text-slate-500">Click or drag to try a different file</p>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-900 mb-1">
                Drop <span className="text-forest-700">{majorLabel}</span> degree plan CSV here
              </p>
              <p className="text-xs text-slate-500">Expected columns: GROUP, GROUP_TYPE, SUBJ, NUMB, SEQ, TITLE</p>
            </>
          )}
        </div>
      )}

      {status === "previewing" && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-center">
          <FileText className="w-6 h-6 text-slate-400 mx-auto mb-2 animate-pulse" />
          <p className="text-sm text-slate-600">Reading <span className="font-medium">{fileName}</span>…</p>
        </div>
      )}

      {status === "awaiting_confirm" && preview && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 space-y-4">
          <div>
            <p className="text-sm font-semibold text-amber-800 mb-1">Confirm data will be read in correctly</p>
            <p className="text-xs text-amber-700 mb-3">
              File: <span className="font-medium">{fileName}</span>
              {" · "}{preview.columns.length} columns · {preview.total_courses} course{preview.total_courses !== 1 ? "s" : ""} found
            </p>
            <div className="rounded-md bg-white border border-amber-200 px-4 py-3">
              <p className="text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">First valid row</p>
              <p className="text-sm font-mono text-slate-800 leading-relaxed break-all">{previewLine}</p>
            </div>
            <p className="text-xs text-amber-700 mt-2">
              This will replace all existing requirements for <span className="font-semibold">{majorLabel}</span>.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleConfirm}
              className="rounded-full px-5 py-2 text-sm font-medium text-white btn-forest"
            >
              Confirm & Import
            </button>
            <button
              onClick={reset}
              className="rounded-full px-5 py-2 text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {status === "importing" && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-center">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-slate-600">Importing…</p>
        </div>
      )}

      {status === "success" && importResult && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 space-y-2">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">Import complete</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                {importResult.courses_inserted} course{importResult.courses_inserted !== 1 ? "s" : ""} across {importResult.groups_created} group{importResult.groups_created !== 1 ? "s" : ""} loaded for {majorLabel}
              </p>
            </div>
          </div>
          <button onClick={reset} className="text-sm text-emerald-700 hover:text-emerald-800 font-medium">
            Upload another file
          </button>
        </div>
      )}
    </div>
  );
}
