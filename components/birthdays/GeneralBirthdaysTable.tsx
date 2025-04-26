type General = {
  name: string;
  baseName: string;
  dateOfBirth: string;
  daysToNextBirthday: number;
  id: string;
};
import { format } from "date-fns";

export default function GeneralBirthdaysTable({ data }: { data: General[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full table-auto">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Base</th>
            <th className="p-2 text-left">Birthday</th>
            <th className="p-2 text-left">Days to Birthday</th>
          </tr>
        </thead>
        <tbody>
          {data.map((general) => (
            <tr key={general.id} className="border-t">
              <td className="p-2">{general.name}</td>
              <td className="p-2">{general.baseName}</td>
              <td className="p-2">{format(new Date(general.dateOfBirth), "do MMMM")}</td>
              <td className="p-2">{general.daysToNextBirthday} Days</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
