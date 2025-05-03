import RequireAuth from "@/components/auth/RequireAuth";
import BirthdayTabs from "@/components/birthdays/BirthdaysTabs";

async function getBirthdays() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/birthdays`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch birthdays");
  return res.json();
}

export default async function BirthdaysPage() {
  const { generals, teens } = await getBirthdays();

  return (
    <RequireAuth>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Upcoming Birthdays 🎉</h1>
        <BirthdayTabs generals={generals} teens={teens} />
      </div>
    </RequireAuth>
  );
}
