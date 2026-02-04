"use client";

import { useState } from "react";

type UploadResult = {
  inserted: number;
  skipped: number;
  message: string;
};

export default function BulkTeenUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [baseId, setBaseId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !baseId) {
      setError("Please select a base and a CSV file");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("baseId", baseId);

    try {
      const res = await fetch("/api/bulk-upload/teens", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 border rounded">
      {/* Base selection (simple for now) */}
      <div>
        <label className="block text-sm font-medium">Base</label>

        <input
          type="text"
          placeholder="Enter baseId"
          value={baseId}
          onChange={(e) => setBaseId(e.target.value)}
          className="w-full border px-3 py-2 rounded text-sm"
        />
      </div>

      {/* CSV file */}
      <div>
        <label className="block text-sm font-medium">CSV File</label>
        <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-sm" />
      </div>

      {/* Error */}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Success */}
      {result && (
        <div className="text-sm text-green-700 bg-green-50 p-3 rounded">
          <p>{result.message}</p>
          <p>Inserted: {result.inserted}</p>
          <p>Skipped: {result.skipped}</p>
        </div>
      )}

      <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50">
        {loading ? "Uploading..." : "Upload CSV"}
      </button>
    </form>
  );
}
