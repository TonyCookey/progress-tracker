"use client";

import { formatDate } from "@/lib/formatDate";
import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import { TableContainer, Table, TableHead, TableHeaderCell, TableRow, TableCell } from "@/components/ui/Table";
import Pagination from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/Toast";

export default function ActivityDetailsPage({ params }: { params: { id: string } }) {
  const toast = useToast();
  const [activity, setActivity] = useState<any>(null);
  const [teens, setTeens] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<{ [teenId: string]: boolean }>({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Fetch activity details
  useEffect(() => {
    fetch(`/api/activities/${params.id}`)
      .then((res) => res.json())
      .then(setActivity);
  }, [params.id]);

  // Fetch teens and participation
  useEffect(() => {
    fetch(`/api/activities/${params.id}/participation`)
      .then((res) => res.json())
      .then((data) => {
        setTeens(data);
        // Initialize attendance state
        const att: { [teenId: string]: boolean } = {};
        data.forEach((t: any) => {
          att[t.id] = t.attended;
        });
        setAttendance(att);
      });
  }, [params.id]);

  // Attendance handler
  const handleMarkAttendance = async (teenId: string) => {
    const previousStatus = attendance[teenId];
    const newStatus = !previousStatus;
    setAttendance((prev) => ({ ...prev, [teenId]: newStatus }));
    try {
      const res = await fetch(`/api/activities/${params.id}/participation`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teenId, attended: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setAttendance((prev) => ({ ...prev, [teenId]: previousStatus }));
        toast.error(data.message ?? "Failed to update attendance");
      }
    } catch (err) {
      setAttendance((prev) => ({ ...prev, [teenId]: previousStatus }));
      toast.error("Failed to update attendance");
    }
  };

  // Search and pagination
  const filteredTeens = teens.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));
  const paginatedTeens = filteredTeens.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredTeens.length / pageSize);

  // Stats
  const totalTeens = teens.length;
  const presentCount = Object.values(attendance).filter(Boolean).length;

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      {/* Top Section: Activity Details & Stats Side by Side */}
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        {/* Activity Details Card */}
        <Card className="space-y-4 flex-1">
          <h2 className="text-2xl font-bold mb-2 text-accent-700">{activity?.name}</h2>
          <p>{activity?.description}</p>
          <p>Date: {formatDate(activity?.date)}</p>
          <p>Base: {activity?.base?.name || "N/A"}</p>
        </Card>
        {/* Stats Card */}
        <Card className="flex-1 h-fit">
          <h3 className="text-lg font-semibold mb-4">Activity Stats</h3>
          <div className="space-y-2 text-base">
            <div>
              <span className="text-neutral-500">Total Teens:</span>
              <span className="ml-2 font-bold text-accent-700">{totalTeens}</span>
            </div>
            <div>
              <span className="text-neutral-500">Present:</span>
              <span className="ml-2 font-bold text-green-600">{presentCount}</span>
            </div>
            <div>
              <span className="text-neutral-500">Absent:</span>
              <span className="ml-2 font-bold text-red-600">{totalTeens - presentCount}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Attendance Table Card */}
      <Card className="p-4 sm:p-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h3 className="text-lg font-semibold">Mark Attendance</h3>
          <Input
            type="text"
            placeholder="Search teens..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="sm:w-64"
          />
        </div>
        {/* Desktop Table */}
        <div className="hidden md:block">
          <TableContainer>
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Name</TableHeaderCell>
                  <TableHeaderCell>Gender</TableHeaderCell>
                  <TableHeaderCell className="text-center">Attendance</TableHeaderCell>
                </tr>
              </TableHead>
              <tbody>
                {paginatedTeens.map((teen) => (
                  <TableRow key={teen.id}>
                    <TableCell className="flex items-center gap-3">
                      <Avatar name={teen.name} size="sm" />
                      <span className="font-medium">{teen.name}</span>
                    </TableCell>
                    <TableCell>{teen.gender}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant={attendance[teen.id] ? "primary" : "secondary"}
                        onClick={() => handleMarkAttendance(teen.id)}
                      >
                        {attendance[teen.id] ? "Present" : "Mark Present"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </TableContainer>
        </div>
        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {paginatedTeens.map((teen) => (
            <Card key={teen.id} padded className="flex flex-col gap-2">
              <div className="flex items-center gap-3 mb-2">
                <Avatar name={teen.name} size="sm" />
                <span className="font-medium text-sm break-words leading-snug">{teen.name}</span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm mb-2">
                <div>
                  <span className="font-semibold">Gender:</span> {teen.gender}
                </div>
              </div>
              <div className="flex mt-2">
                <Button
                  className="w-full"
                  variant={attendance[teen.id] ? "primary" : "secondary"}
                  onClick={() => handleMarkAttendance(teen.id)}
                >
                  {attendance[teen.id] ? "Present" : "Mark Present"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
        {/* Pagination */}
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </Card>
    </div>
  );
}
