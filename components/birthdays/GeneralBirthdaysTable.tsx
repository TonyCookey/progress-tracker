import { format } from "date-fns";

type General = {
  name: string;
  baseName: string;
  dateOfBirth: string;
  daysToNextBirthday: number;
  id: string;
};

export default function GeneralBirthdaysTable({ data }: { data: General[] }) {
  return (
    <div className="overflow-x-auto border rounded-xl shadow bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-blue-50 ">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">Name</th>
            <th className="px-4 py-3 text-left font-semibold">Base</th>
            <th className="px-4 py-3 text-left font-semibold">Birthday</th>
            <th className="px-4 py-3 text-left font-semibold">Days to Birthday</th>
          </tr>
        </thead>
        <tbody>
          {data.map((general, idx) => (
            <tr key={general.id} className={`transition-colors hover:bg-blue-50 ${idx % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
              <td className="px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-cyan-50 flex items-center justify-center text-blue-700 font-bold text-sm">
                  {general.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium">{general.name}</span>
              </td>
              <td className="px-4 py-3">{general.baseName}</td>
              <td className="px-4 py-3">{format(new Date(general.dateOfBirth), "do MMMM")}</td>
              <td className="px-4 py-3">
                <span className="inline-block bg-yellow-100 text-yellow-800 px-4 py-1 rounded-full text-sm font-semibold">
                  {general.daysToNextBirthday} Days
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
