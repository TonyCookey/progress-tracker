import RequireAuth from "@/components/auth/RequireAuth";
import BirthdayTabs from "@/components/birthdays/BirthdaysTabs";
import { getUpcomingBirthdays } from "@/lib/getUpcomingBirthdays";

export const dynamic = "force-dynamic";

export default async function BirthdaysPage() {
  const { generals, teens } = await getUpcomingBirthdays();

  return (
    <RequireAuth>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Upcoming Birthdays 🎉</h1>
        <BirthdayTabs generals={generals as any[]} teens={teens as any[]} />
      </div>
    </RequireAuth>
  );
}
