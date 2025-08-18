import Link from "next/link";
import RequireAuth from "@/components/auth/RequireAuth";
import CreateGroupModal from "@/components/modals/CreateGroupModal";

export default async function PlatoonsPage() {
  const [platoonsRes, basesRes, leadersRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/groups?type=PLATOON`, { cache: "no-store" }),
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/bases`, { cache: "no-store" }),
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/users`, { cache: "no-store" }),
  ]);
  if (!platoonsRes.ok || !basesRes.ok || !leadersRes.ok) {
    throw new Error("Failed to fetch data");
  }
  const platoons = await platoonsRes.json();
  const bases = await basesRes.json();
  const leaders = await leadersRes.json();

  return (
    <RequireAuth>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold">Platoons</h1>
          <CreateGroupModal bases={bases} leaders={leaders} type="PLATOON" />
        </div>

        <ul className="space-y-2">
          {platoons.map((squad: any) => (
            <Link href={`/dashboard/platoons/${squad.id}`} key={squad.id} className="block">
              <li key={squad.id} className="border rounded p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-1">{squad.name}</h2>
                <p className="text-sm text-gray-600">
                  Led by {squad.leader?.name ?? ""} - {squad.base?.name ?? ""} Base
                </p>
              </li>
            </Link>
          ))}
        </ul>
      </div>
    </RequireAuth>
  );
}
// This page fetches and displays a list of platoons, along with a modal to create new platoons.
