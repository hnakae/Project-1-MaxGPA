"use client";

import { useState } from "react";

import { CsvUploadZone } from "../components/csv-upload-zone";
import { DataTable } from "../components/data-table";

export default function AdminPage() {
  const [majorRequirements, setMajorRequirements] = useState([
    { id: 1, majorId: 1, major: "Computer Science", subject: "CS", courseNumber: 210, credits: 4, required: true },
    { id: 2, majorId: 1, major: "Computer Science", subject: "CS", courseNumber: 313, credits: 4, required: true },
    { id: 3, majorId: 1, major: "Computer Science", subject: "CS", courseNumber: 415, credits: 4, required: true },
    { id: 4, majorId: 1, major: "Computer Science", subject: "CS", courseNumber: 422, credits: 4, required: false },
    { id: 5, majorId: 2, major: "Business Administration", subject: "BA", courseNumber: 101, credits: 3, required: true },
    { id: 6, majorId: 2, major: "Business Administration", subject: "BA", courseNumber: 250, credits: 4, required: true },
    { id: 7, majorId: 3, major: "Biology", subject: "BI", courseNumber: 211, credits: 4, required: true },
    { id: 8, majorId: 3, major: "Biology", subject: "BI", courseNumber: 212, credits: 4, required: true },
  ]);

  const handleUploadComplete = (_data: unknown[]) => {
    // Connect this to CSV ingestion when the admin import flow is wired up.
    void _data;
  };

  const handleUpdateRow = (id: number, field: string, value: string | number | boolean) => {
    setMajorRequirements((previous) =>
      previous.map((requirement) =>
        requirement.id === id ? { ...requirement, [field]: value } : requirement,
      ),
    );
  };

  const handleDeleteRow = (id: number) => {
    setMajorRequirements((previous) => previous.filter((requirement) => requirement.id !== id));
  };

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-slate-900 mb-2">Admin Portal</h1>
        <p className="text-slate-600">Manage grade data and major requirements</p>
      </div>

      <section className="mb-12">
        <h2 className="text-slate-900 mb-2">Import Grade Data</h2>
        <p className="mb-4 text-sm text-slate-600">
          Upload CSV with format: Term, Subject, Number, CRN, Instructor, Grade, Count
          <br />
          Grades will be automatically sanitized (A+, A, A- → A)
        </p>
        <CsvUploadZone onUploadComplete={handleUploadComplete} />
      </section>

      <section>
        <h2 className="text-slate-900 mb-2">Major Degree Requirements</h2>
        <p className="mb-4 text-sm text-slate-600">
          Manage required courses for Computer Science, Business Administration, and Biology majors
        </p>
        <DataTable
          data={majorRequirements}
          onUpdateRow={handleUpdateRow}
          onDeleteRow={handleDeleteRow}
        />
      </section>
    </div>
  );
}
