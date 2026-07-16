import { format } from "date-fns";
import { TableContainer, Table, TableHead, TableHeaderCell, TableRow, TableCell } from "@/components/ui/Table";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

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
          <Card key={general.id} padded className="p-4 flex flex-col gap-2">
            <div className="flex items-center gap-3 mb-2">
              <Avatar name={general.name} size="sm" />
              <span className="font-medium text-sm break-words leading-snug text-neutral-900">{general.name}</span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm mb-2 text-neutral-600">
              <div>
                <span className="font-semibold text-neutral-700">Base:</span> {general.baseName}
              </div>
              <div>
                <span className="font-semibold text-neutral-700">Birthday:</span> {format(new Date(general.dateOfBirth), "do MMMM")}
              </div>
            </div>
            <div>
              <Badge tone="warning">{general.daysToNextBirthday} Days</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
