import { Trash2, Edit2 } from "lucide-react";
import { useState } from "react";

interface DataRow {
  id: number;
  majorId?: number;
  major: string;
  subject?: string;
  courseNumber?: number;
  credits: number;
  required: boolean;
}

interface DataTableProps {
  data: DataRow[];
  onUpdateRow: (id: number, field: string, value: string | number | boolean) => void;
  onDeleteRow: (id: number) => void;
}

export function DataTable({ data, onUpdateRow, onDeleteRow }: DataTableProps) {
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const handleEdit = (
    id: number,
    field: string,
    currentValue: string | number | boolean | undefined,
  ) => {
    setEditingCell({ id, field });
    setEditValue(String(currentValue ?? ""));
  };

  const handleSave = () => {
    if (editingCell) {
      const { id, field } = editingCell;
      let value: string | number | boolean = editValue;

      if (field === "credits" || field === "courseNumber") {
        value = parseInt(editValue, 10);
      } else if (field === "required") {
        value = editValue === "true";
      }

      onUpdateRow(id, field, value);
      setEditingCell(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setEditingCell(null);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Major</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Subject</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Course #</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Credits</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Required</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  {editingCell?.id === row.id && editingCell.field === "major" ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleSave}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      className="px-2 py-1 border border-emerald-500 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  ) : (
                    <div
                      className="flex items-center gap-2 cursor-pointer group"
                      onClick={() => handleEdit(row.id, "major", row.major)}
                    >
                      <span className="text-slate-900">{row.major}</span>
                      <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingCell?.id === row.id && editingCell.field === "subject" ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleSave}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      className="w-20 px-2 py-1 border border-emerald-500 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  ) : (
                    <div
                      className="flex items-center gap-2 cursor-pointer group"
                      onClick={() => handleEdit(row.id, "subject", row.subject)}
                    >
                      <span className="text-slate-900">{row.subject}</span>
                      <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingCell?.id === row.id && editingCell.field === "courseNumber" ? (
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleSave}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      className="w-20 px-2 py-1 border border-emerald-500 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  ) : (
                    <div
                      className="flex items-center gap-2 cursor-pointer group"
                      onClick={() => handleEdit(row.id, "courseNumber", row.courseNumber)}
                    >
                      <span className="text-slate-900">{row.courseNumber}</span>
                      <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingCell?.id === row.id && editingCell.field === "credits" ? (
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleSave}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      className="w-20 px-2 py-1 border border-emerald-500 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  ) : (
                    <div
                      className="flex items-center gap-2 cursor-pointer group"
                      onClick={() => handleEdit(row.id, "credits", row.credits)}
                    >
                      <span className="text-slate-900">{row.credits}</span>
                      <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      row.required
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {row.required ? "Required" : "Elective"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => onDeleteRow(row.id)}
                    className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm">Delete</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
