export default async function PlatoonDetailsPage({ params }: { params: { id: string } }) {
  //   const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/groups/${params.id}`, { cache: "no-store" });
  //   if (!res.ok) {
  //   }
  //   const platoon = await res.json();

  const platoon = {
    id: "platoon-123",
    name: "Alpha Platoon",
    base: { id: "base-1", name: "Main Base" },
    leader: { id: "leader-1", name: "John Doe", email: "john.doe@example.com" },
    teens: [
      { id: "teen-1", name: "Jane Smith", email: "jane.smith@example.com" },
      { id: "teen-2", name: "Mark Johnson", email: "mark.johnson@example.com" },
    ],
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2">{platoon.name}</h1>
        <p className="text-gray-600 mb-4">
          <span className="font-semibold">Base:</span> {platoon.base?.name ?? "N/A"}
        </p>
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-1">General Leading</h2>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold">{platoon.leader?.name?.[0] ?? "?"}</div>
            <div>
              <p className="font-medium">{platoon.leader?.name ?? "No leader assigned"}</p>
              <p className="text-sm text-gray-500">{platoon.leader?.email ?? ""}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Teens in this Platoon</h2>
        {platoon.teens?.length ? (
          <ul className="space-y-3">
            {platoon.teens.map((teen: any) => (
              <li key={teen.id} className="flex items-center gap-3 border-b pb-2">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg font-bold">{teen.name?.[0] ?? "?"}</div>
                <div>
                  <p className="font-medium">{teen.name}</p>
                  <p className="text-sm text-gray-500">{teen.email}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No teens assigned to this platoon.</p>
        )}
      </div>
    </div>
  );
}
