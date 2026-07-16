import RequireAuth from "@/components/auth/RequireAuth";

export default function EventsPage() {
  return (
    <RequireAuth>
      <div className="p-4 md:p-6">
        <h1 className="text-xl font-semibold">Activities & Events</h1>
        {/* Attendance, Hangouts, Bible Study, etc. */}
      </div>
    </RequireAuth>
  );
}
