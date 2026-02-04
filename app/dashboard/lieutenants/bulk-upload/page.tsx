import BulkTeenUploadForm from "@/components/lieutenants/BulkUploadForm";

export default function ReportsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Bulk Upload Lieutenants</h1>
      <p className="mt-4 text-gray-700">
        {" "}
        Upload a CSV file with lieutenant details. The CSV should have columns: <code>name</code> and <code>gender</code>.
      </p>
      <BulkTeenUploadForm />
    </div>
  );
}
