import RequireAuth from "@/components/auth/RequireAuth";
import BirthdayTabs from "@/components/birthdays/BirthdaysTabs";
import { getUpcomingBirthdays } from "@/lib/getUpcomingBirthdays";
import PageHeader from "@/components/ui/PageHeader";

export const dynamic = "force-dynamic";

export default async function BirthdaysPage() {
  const { generals, teens } = await getUpcomingBirthdays();

  return (
    <RequireAuth>
      <div className="p-6">
        <PageHeader title="Upcoming Birthdays 🎉" />
        <BirthdayTabs generals={generals as any[]} teens={teens as any[]} />
      </div>
    </RequireAuth>
  );
}
