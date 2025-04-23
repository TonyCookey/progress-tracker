import RequireAuth from "@/components/auth/RequireAuth"

export default function DashboardPage() {
    return (
      <RequireAuth>
        <div className="p-6">
          <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
            {/* Charts and key metrics go here */}
        </div>
      </RequireAuth>
    
    )
  }
  