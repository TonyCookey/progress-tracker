import { format } from "date-fns";
import { TableContainer, Table, TableHead, TableHeaderCell, TableRow, TableCell } from "@/components/ui/Table";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";

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
      <div className="hidden md:block">
        <TableContainer>
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Gender</TableHeaderCell>
                <TableHeaderCell>Rank</TableHeaderCell>
                <TableHeaderCell>Base</TableHeaderCell>
                <TableHeaderCell>Birthday</TableHeaderCell>
              </tr>
            </TableHead>
            <tbody>
              {data.map((teen) => (
                <TableRow key={teen.id}>
                  <TableCell className="flex items-center gap-3">
                    <Avatar name={teen.name} size="sm" />
                    <span className="font-medium text-neutral-900">{teen.name}</span>
                  </TableCell>
                  <TableCell>
                    <Badge tone="accent">{teen.gender}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge tone="neutral" size="sm">
                      {teen.rank}
                    </Badge>
                  </TableCell>
                  <TableCell>{teen.baseName}</TableCell>
                  <TableCell>{format(new Date(teen.dateOfBirth), "do MMMM")}</TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </TableContainer>
      </div>
      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {data.map((teen) => (
          <div key={teen.id} className="border border-neutral-200 rounded-card shadow-soft bg-white p-4 flex flex-col gap-2">
            <div className="flex items-center gap-3 mb-2">
              <Avatar name={teen.name} size="sm" />
              <span className="font-medium text-sm break-words leading-snug">{teen.name}</span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm mb-2">
              <div>
                <span className="font-semibold">Gender:</span> <Badge tone="accent">{teen.gender}</Badge>
              </div>
              <div>
                <span className="font-semibold">Rank:</span>{" "}
                <Badge tone="neutral" size="sm">
                  {teen.rank}
                </Badge>
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
