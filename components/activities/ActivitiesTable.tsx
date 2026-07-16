"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import LoadingSpinner from "../common/LoadingSpinner";
import { EyeIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { TableContainer, Table, TableHead, TableHeaderCell, TableRow, TableCell } from "@/components/ui/Table";

type Activity = {
  id: string;
  name: string;
  type: string;
  date: string;
  isCrossBase: boolean;
  base?: { name: string };
  groups: { id: string; name: string }[];
};

export default function ActivitiesTable() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivities() {
      const res = await fetch("/api/activities");
      const data = await res.json();
      setActivities(data);
      setLoading(false);
    }

    fetchActivities();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {/* Desktop Table */}
      <div className="hidden md:block">
        <TableContainer>
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Type</TableHeaderCell>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Base</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </tr>
            </TableHead>
            <tbody>
              {activities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell className="font-medium">{activity.name}</TableCell>
                  <TableCell>
                    <Badge tone="accent">{activity.type}</Badge>
                  </TableCell>
                  <TableCell>{format(new Date(activity.date), "do MMM yyyy")}</TableCell>
                  <TableCell>
                    {activity.isCrossBase ? <Badge tone="success">Yes</Badge> : <Badge tone="warning">No</Badge>}
                  </TableCell>
                  <TableCell>
                    <Link href={`/dashboard/activities/${activity.id}`} title="View" className="inline-flex p-2 rounded-pill hover:bg-accent-50 transition">
                      <EyeIcon className="w-5 h-5 text-accent-600" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </TableContainer>
      </div>
      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {activities.map((activity) => (
          <Card key={activity.id} padded className="flex flex-col gap-2">
            <div className="mb-2">
              <Badge tone="accent" className="mb-1">
                {activity.type}
              </Badge>
              <span className="block font-medium text-base break-words leading-snug mt-3 mb-1">{activity.name}</span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span className="font-semibold">Date:</span> {format(new Date(activity.date), "do MMM yyyy")}
              </div>
              <div>
                <span className="font-semibold">Base:</span>{" "}
                {activity.base?.name ? <Badge tone="success">Yes</Badge> : <Badge tone="warning">No</Badge>}
              </div>
            </div>
            <div className="flex mt-2 justify-end">
              <Link href={`/dashboard/activities/${activity.id}`} title="View" className="p-2 rounded-pill hover:bg-accent-50 transition">
                <ArrowRightIcon className="w-5 h-5 text-accent-600" />
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
