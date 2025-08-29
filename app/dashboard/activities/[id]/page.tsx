"use client";

import { formatDate } from "@/lib/formatDate";
import { useEffect, useState } from "react";

export default function ActivityDetailsPage({ params }: { params: { id: string } }) {
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
    const newStatus = !attendance[teenId];
    setAttendance((prev) => ({ ...prev, [teenId]: newStatus }));
    await fetch(`/api/activities/${params.id}/participation`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teenId, attended: newStatus }),
    });
  };

  // Search and pagination
  const filteredTeens = teens.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));
  const paginatedTeens = filteredTeens.slice((page - 1) * pageSize, page * pageSize);

  // Stats
  const totalTeens = teens.length;
  const presentCount = Object.values(attendance).filter(Boolean).length;

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      {/* Top Section: Activity Details & Stats Side by Side */}
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        {/* Activity Details Card */}
        <div className="space-y-4 flex-1 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold mb-2 text-blue-700">{activity?.name}</h2>
          <p>{activity?.description}</p>
          <p>Date: {formatDate(activity?.date)}</p>
        </div>
        {/* Stats Card */}
        <div className="flex-1 bg-white rounded-xl shadow-lg p-8 h-fit">
          <h3 className="text-xl font-semibold mb-4">Activity Stats</h3>
          <div className="space-y-2 text-lg">
            <div>
              <span className="text-gray-500">Total Teens:</span>
              <span className="ml-2 font-bold text-blue-700">{totalTeens}</span>
            </div>
            <div>
              <span className="text-gray-500">Present:</span>
              <span className="ml-2 font-bold text-green-600">{presentCount}</span>
            </div>
            <div>
              <span className="text-gray-500">Absent:</span>
              <span className="ml-2 font-bold text-red-600">{totalTeens - presentCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Table Card */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Mark Attendance</h3>
          <input
            type="text"
            placeholder="Search teens..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="border px-3 py-2 rounded w-64"
          />
        </div>
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-blue-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Gender</th>
              <th className="px-4 py-3 text-center font-semibold">Attendance</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTeens.map((teen) => (
              <tr key={teen.id} className="transition-colors hover:bg-blue-50">
                <td className="px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                    {teen.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium">{teen.name}</span>
                </td>
                <td className="px-4 py-3">{teen.gender}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleMarkAttendance(teen.id)}
                    className={`px-4 py-2 rounded-full font-semibold transition ${
                      attendance[teen.id] ? "bg-green-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-blue-100"
                    }`}
                  >
                    {attendance[teen.id] ? "Present" : "Mark Present"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Pagination */}
        <div className="flex justify-end mt-4 space-x-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 transition"
          >
            Previous
          </button>
          <span className="px-2 py-1 font-medium text-gray-700">
            Page {page} of {Math.ceil(filteredTeens.length / pageSize)}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(Math.ceil(filteredTeens.length / pageSize), p + 1))}
            disabled={page === Math.ceil(filteredTeens.length / pageSize)}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 transition"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
