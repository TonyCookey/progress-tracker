import BulkTeenUploadForm from "@/components/lieutenants/BulkUploadForm";
import PageHeader from "@/components/ui/PageHeader";

export default function ReportsPage() {
  return (
    <div className="p-4 md:p-6">
      <PageHeader title="Bulk Upload Lieutenants" />
      <p className="mt-1 mb-4 text-sm text-neutral-500">
        Upload a CSV file with lieutenant details. The CSV should have columns: <code>name</code> and <code>gender</code>.
      </p>
      <BulkTeenUploadForm />
    </div>
  );
}
