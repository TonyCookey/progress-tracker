import Link from "next/link";
import clsx from "clsx";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";

type GroupCard = {
  id: string;
  name: string;
  baseId: string;
  base?: { name: string } | null;
  leader?: { name: string } | null;
  _count?: { teens?: number; members?: number };
};

// Shared squads/platoons listing: base filter chips (driven by ?baseId=, so dashboard
// cards can deep-link to "Alpha squads") and a card grid with member counts.
export default function GroupDirectory({
  groups,
  bases,
  baseId,
  basePath,
  noun,
}: {
  groups: GroupCard[];
  bases: { id: string; name: string }[];
  baseId?: string;
  basePath: string;
  noun: "squad" | "platoon";
}) {
  const visible = baseId ? groups.filter((g) => g.baseId === baseId) : groups;
  const chips = [{ id: "", name: "All bases" }, ...bases];

  return (
    <div className="space-y-5">
      {bases.length > 1 && (
        <nav className="flex flex-wrap gap-2" aria-label="Filter by base">
          {chips.map((b) => {
            const active = (baseId ?? "") === b.id;
            const count = b.id ? groups.filter((g) => g.baseId === b.id).length : groups.length;
            return (
              <Link
                key={b.id || "all"}
                href={b.id ? `${basePath}?baseId=${b.id}` : basePath}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "text-sm px-3 py-1.5 rounded-pill font-medium transition-colors",
                  active ? "bg-accent-600 text-white" : "bg-white border border-neutral-200 text-neutral-700 hover:border-accent-300",
                )}
              >
                {b.name} <span className={active ? "text-white/80" : "text-neutral-400"}>{count}</span>
              </Link>
            );
          })}
        </nav>
      )}

      {visible.length ? (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((group) => {
            const members = group._count?.teens ?? group._count?.members ?? 0;
            return (
              <li key={group.id}>
                <Link href={`${basePath}/${group.id}`} className="block group">
                  <Card className="flex flex-col gap-3 h-full group-hover:shadow-softHover transition-shadow">
                    <div className="flex items-center gap-3">
                      <Avatar name={group.name ?? noun[0].toUpperCase()} size="md" />
                      <div className="min-w-0">
                        <h2 className="text-base font-bold text-neutral-900 truncate">{group.name}</h2>
                        <p className="text-xs text-neutral-500">
                          {members} {members === 1 ? "member" : "members"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge tone="success" size="sm">
                        {group.leader?.name ?? "No leader"}
                      </Badge>
                      <Badge tone="neutral" size="sm">
                        {group.base?.name ?? "No"} Base
                      </Badge>
                    </div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState title={`No ${noun}s ${baseId ? "in this base " : ""}yet`} description={`Create a ${noun} to get started.`} />
      )}
    </div>
  );
}
