type Lieutenant = {
  name: string;
  gender: string;
  rank: string;
  baseName: string;
  dateOfBirth: string;
  id: string;
};
import { format } from "date-fns";

export default function TeenBirthdaysTable({ data }: { data: Lieutenant[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full table-auto">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Gender</th>
            <th className="p-2 text-left">Rank</th>
            <th className="p-2 text-left">Base</th>
            <th className="p-2 text-left">Birthday</th>
          </tr>
        </thead>
        <tbody>
          {data.map((teen) => (
            <tr key={teen.id} className="border-t">
              <td className="p-2">{teen.name}</td>
              <td className="p-2">{teen.gender}</td>
              <td className="p-2">{teen.rank}</td>
              <td className="p-2">{teen.baseName}</td>
              <td className="p-2">{format(new Date(teen.dateOfBirth), "do MMMM")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
