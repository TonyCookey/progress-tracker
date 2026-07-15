import Link from "next/link";
import RequireAuth from "@/components/auth/RequireAuth";
import CreateHouseholdModal from "@/components/households/CreateHouseholdModal";
import { getHouseholds } from "@/lib/households";
import { getBases } from "@/lib/bases";

export const dynamic = "force-dynamic";

export default async function HouseholdsPage() {
  const [households, bases] = await Promise.all([getHouseholds(), getBases()]);

  return (
    <RequireAuth>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold">Households</h1>
          <CreateHouseholdModal bases={bases} />
        </div>

        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {households.map((household: any) => (
            <Link href={`/dashboard/households/${household.id}`} key={household.id} className="block transition-transform hover:scale-[1.02] hover:shadow-lg">
              <li className="border rounded-xl p-6 shadow-sm bg-white flex flex-col gap-2">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center text-600 font-bold text-lg">
                    {household.name?.charAt(0) ?? "H"}
                  </div>
                  <h2 className="text-lg font-bold">{household.name}</h2>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">{household.base?.name ?? "No Base"} Base</span>
                  <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                    {household.teens?.length ?? 0} Member{household.teens?.length === 1 ? "" : "s"}
                  </span>
                </div>
                {household.primaryContactName && <p className="text-sm text-gray-600">{household.primaryContactName}</p>}
              </li>
            </Link>
          ))}
        </ul>
        {!households.length && <p className="text-gray-500">No households yet.</p>}
      </div>
    </RequireAuth>
  );
}
