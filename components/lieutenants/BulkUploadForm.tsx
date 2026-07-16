"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

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
    <Card padded>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Base selection (simple for now) */}
        <Input label="Base" type="text" placeholder="Enter baseId" value={baseId} onChange={(e) => setBaseId(e.target.value)} />

        {/* CSV file */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">CSV File</label>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-neutral-700 file:mr-3 file:py-2 file:px-4 file:rounded-pill file:border-0 file:bg-accent-50 file:text-accent-700 file:font-medium hover:file:bg-accent-100"
          />
        </div>

        {/* Error */}
        {error && <p className="text-sm text-danger-500">{error}</p>}

        {/* Success */}
        {result && (
          <div className="text-sm text-success-700 bg-success-50 p-3 rounded-lg">
            <p>{result.message}</p>
            <p>Inserted: {result.inserted}</p>
            <p>Skipped: {result.skipped}</p>
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Uploading..." : "Upload CSV"}
        </Button>
      </form>
    </Card>
  );
}
