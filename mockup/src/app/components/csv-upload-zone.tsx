import { useState, useRef } from "react";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";
import * as Progress from "@radix-ui/react-progress";

interface CsvUploadZoneProps {
  onUploadComplete: (data: any[]) => void;
}

export function CsvUploadZone({ onUploadComplete }: CsvUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".csv")) {
      handleFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = (file: File) => {
    setFileName(file.name);
    setUploadStatus("uploading");
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploadStatus("success");
          // Mock data parsing
          onUploadComplete([{ course: "CS 210", avgGpa: 3.72 }]);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-8">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
          isDragging
            ? "border-emerald-500 bg-emerald-50"
            : uploadStatus === "success"
            ? "border-emerald-300 bg-emerald-50"
            : uploadStatus === "error"
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

        {uploadStatus === "idle" && (
          <>
            <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-900 mb-2">Drag and drop CSV file here</p>
            <p className="text-sm text-slate-500">or click to browse</p>
          </>
        )}

        {uploadStatus === "uploading" && (
          <>
            <div className="mb-4">
              <p className="text-slate-900 mb-2">Uploading {fileName}...</p>
              <Progress.Root
                value={uploadProgress}
                className="w-full h-2 bg-slate-200 rounded-full overflow-hidden"
              >
                <Progress.Indicator
                  className="h-full bg-emerald-600 transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </Progress.Root>
              <p className="text-sm text-slate-500 mt-2">{uploadProgress}%</p>
            </div>
          </>
        )}

        {uploadStatus === "success" && (
          <>
            <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
            <p className="text-emerald-900 mb-2">Upload complete!</p>
            <p className="text-sm text-emerald-600">{fileName}</p>
          </>
        )}

        {uploadStatus === "error" && (
          <>
            <AlertCircle className="w-12 h-12 text-rose-600 mx-auto mb-4" />
            <p className="text-rose-900 mb-2">Upload failed</p>
            <p className="text-sm text-rose-600">Please try again</p>
          </>
        )}
      </div>

      {uploadStatus === "success" && (
        <button
          onClick={() => {
            setUploadStatus("idle");
            setFileName("");
            setUploadProgress(0);
          }}
          className="mt-4 text-sm text-emerald-700 hover:text-emerald-800 font-medium"
        >
          Upload another file
        </button>
      )}
    </div>
  );
}
