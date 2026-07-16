import { format } from "date-fns";
import { TableContainer, Table, TableHead, TableHeaderCell, TableRow, TableCell } from "@/components/ui/Table";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

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
          <Card key={teen.id} padded className="p-4 flex flex-col gap-2">
            <div className="flex items-center gap-3 mb-2">
              <Avatar name={teen.name} size="sm" />
              <span className="font-medium text-sm break-words leading-snug text-neutral-900">{teen.name}</span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm mb-2 text-neutral-600">
              <div>
                <span className="font-semibold text-neutral-700">Gender:</span> <Badge tone="accent">{teen.gender}</Badge>
              </div>
              <div>
                <span className="font-semibold text-neutral-700">Rank:</span>{" "}
                <Badge tone="neutral" size="sm">
                  {teen.rank}
                </Badge>
              </div>
              <div>
                <span className="font-semibold text-neutral-700">Base:</span> {teen.baseName}
              </div>
              <div>
                <span className="font-semibold text-neutral-700">Birthday:</span> {format(new Date(teen.dateOfBirth), "do MMMM")}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
