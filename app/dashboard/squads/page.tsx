import RequireAuth from "@/components/auth/RequireAuth";
import CreateGroupModal from "@/components/modals/CreateGroupModal";
import Link from "next/link";

export default async function SquadsPage() {
  const [squadsRes, basesRes, leadersRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/groups?type=SQUAD`, { cache: "no-store" }),
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/bases`, { cache: "no-store" }),
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/users`, { cache: "no-store" }),
  ]);
  if (!squadsRes.ok || !basesRes.ok || !leadersRes.ok) {
    throw new Error("Failed to fetch data");
  }
  const squads = await squadsRes.json();
  const bases = await basesRes.json();
  const leaders = await leadersRes.json();

  return (
    <RequireAuth>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold">Squads</h1>
          <CreateGroupModal bases={bases} leaders={leaders} type="SQUAD" />
        </div>

        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {squads.map((squad: any) => (
            <Link href={`/dashboard/squads/${squad.id}`} key={squad.id} className="block transition-transform hover:scale-[1.02] hover:shadow-lg">
              <li className="border rounded-xl p-6 shadow-sm bg-white flex flex-col gap-2">
                <div className="flex items-center gap-3 mb-2">
                  {/* Avatar or icon */}
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-lg">
                    {squad.name?.charAt(0) ?? "S"}
                  </div>
                  <h2 className="text-lg font-bold">{squad.name}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">{squad.leader?.name ?? "No Leader"}</span>
                  <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">{squad.base?.name ?? "No Base"} Base</span>
                </div>
              </li>
            </Link>
          ))}
        </ul>
      </div>
    </RequireAuth>
  );
}
// This page fetches and displays a list of squads, along with a modal to create new squads.
