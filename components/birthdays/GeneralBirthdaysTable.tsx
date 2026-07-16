import { format } from "date-fns";
import { TableContainer, Table, TableHead, TableHeaderCell, TableRow, TableCell } from "@/components/ui/Table";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";

type General = {
  name: string;
  baseName: string;
  dateOfBirth: string;
  daysToNextBirthday: number;
  id: string;
};

export default function GeneralBirthdaysTable({ data }: { data: General[] }) {
  return (
    <div>
      {/* Desktop Table */}
      <div className="hidden md:block">
        <TableContainer>
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Base</TableHeaderCell>
                <TableHeaderCell>Birthday</TableHeaderCell>
                <TableHeaderCell>Days to Birthday</TableHeaderCell>
              </tr>
            </TableHead>
            <tbody>
              {data.map((general) => (
                <TableRow key={general.id}>
                  <TableCell className="flex items-center gap-3">
                    <Avatar name={general.name} size="sm" />
                    <span className="font-medium text-neutral-900">{general.name}</span>
                  </TableCell>
                  <TableCell>{general.baseName}</TableCell>
                  <TableCell>{format(new Date(general.dateOfBirth), "do MMMM")}</TableCell>
                  <TableCell>
                    <Badge tone="warning">{general.daysToNextBirthday} Days</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </TableContainer>
      </div>
      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {data.map((general) => (
          <div key={general.id} className="border border-neutral-200 rounded-card shadow-soft bg-white p-4 flex flex-col gap-2">
            <div className="flex items-center gap-3 mb-2">
              <Avatar name={general.name} size="sm" />
              <span className="font-medium text-base break-words leading-snug">{general.name}</span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm mb-2">
              <div>
                <span className="font-semibold">Base:</span> {general.baseName}
              </div>
              <div>
                <span className="font-semibold">Birthday:</span> {format(new Date(general.dateOfBirth), "do MMMM")}
              </div>
            </div>
            <div>
              <Badge tone="warning">{general.daysToNextBirthday} Days</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
