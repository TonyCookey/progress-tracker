import { format } from "date-fns";

type Lieutenant = {
  name: string;
  gender: string;
  rank: string;
  baseName: string;
  dateOfBirth: string;
  id: string;
};

export default function TeenBirthdaysTable({ data }: { data: Lieutenant[] }) {
  return (
    <div>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto border rounded-xl shadow bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-50 text-800">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Gender</th>
              <th className="px-4 py-3 text-left font-semibold">Rank</th>
              <th className="px-4 py-3 text-left font-semibold">Base</th>
              <th className="px-4 py-3 text-left font-semibold">Birthday</th>
            </tr>
          </thead>
          <tbody>
            {data.map((teen, idx) => (
              <tr key={teen.id} className={`transition-colors hover:bg-blue-50 ${idx % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
                <td className="px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-50 flex items-center justify-center text-blue-700 font-bold text-sm">
                    {teen.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium">{teen.name}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-block bg-cyan-100 text-cyan-700 px-2 py-1 rounded-full text-sm font-semibold">{teen.gender}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-block bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-semibold">{teen.rank}</span>
                </td>
                <td className="px-4 py-3">{teen.baseName}</td>
                <td className="px-4 py-3">{format(new Date(teen.dateOfBirth), "do MMMM")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {data.map((teen) => (
          <div key={teen.id} className="border rounded-xl shadow bg-white p-4 flex flex-col gap-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-cyan-50 flex items-center justify-center text-blue-700 font-bold text-sm">
                {teen.name.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium text-base break-words leading-snug">{teen.name}</span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm mb-2">
              <div>
                <span className="font-semibold">Gender:</span>{" "}
                <span className="inline-block bg-cyan-100 text-cyan-700 px-2 py-1 rounded-full text-xs font-semibold">{teen.gender}</span>
              </div>
              <div>
                <span className="font-semibold">Rank:</span>{" "}
                <span className="inline-block bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-semibold">{teen.rank}</span>
              </div>
              <div>
                <span className="font-semibold">Base:</span> {teen.baseName}
              </div>
              <div>
                <span className="font-semibold">Birthday:</span> {format(new Date(teen.dateOfBirth), "do MMMM")}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
