import { useState } from "react";
import { CsvUploadZone } from "../components/csv-upload-zone";
import { DataTable } from "../components/data-table";

export function AdminPage() {
  const [majorRequirements, setMajorRequirements] = useState([
    { id: 1, major: "Computer Science", course: "CS 210", credits: 4, required: true },
    { id: 2, major: "Computer Science", course: "CS 313", credits: 4, required: true },
    { id: 3, major: "Computer Science", course: "CS 415", credits: 4, required: true },
    { id: 4, major: "Computer Science", course: "CS 422", credits: 4, required: false },
    { id: 5, major: "Business", course: "BA 101", credits: 3, required: true },
    { id: 6, major: "Business", course: "BA 250", credits: 4, required: true },
    { id: 7, major: "Biology", course: "BI 211", credits: 4, required: true },
    { id: 8, major: "Biology", course: "BI 212", credits: 4, required: true },
  ]);

  const handleUploadComplete = (data: any[]) => {
    console.log("CSV data uploaded:", data);
    // Here you would process and integrate the uploaded data
  };

  const handleUpdateRow = (id: number, field: string, value: any) => {
    setMajorRequirements(prev =>
      prev.map(req => req.id === id ? { ...req, [field]: value } : req)
    );
  };

  const handleDeleteRow = (id: number) => {
    setMajorRequirements(prev => prev.filter(req => req.id !== id));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-slate-900 mb-2">Admin Portal</h1>
        <p className="text-slate-600">Manage grade data and major requirements</p>
      </div>

      {/* CSV Upload Section */}
      <section className="mb-12">
        <h2 className="text-slate-900 mb-4">Import Grade Data</h2>
        <CsvUploadZone onUploadComplete={handleUploadComplete} />
      </section>

      {/* Major Requirements Table */}
      <section>
        <h2 className="text-slate-900 mb-4">Major Degree Requirements</h2>
        <DataTable
          data={majorRequirements}
          onUpdateRow={handleUpdateRow}
          onDeleteRow={handleDeleteRow}
        />
      </section>
    </div>
  );
}
