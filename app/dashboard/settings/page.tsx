import RequireRole from "@/components/auth/RequireRole";
import SettingsTabs from "@/components/settings/SettingsTabs";
import PageHeader from "@/components/ui/PageHeader";

export default function SettingsPage() {
  return (
    <RequireRole roles={["SUPERADMIN"]}>
      <div className="p-6">
        <PageHeader title="Settings" />
        <SettingsTabs />
      </div>
    </RequireRole>
  );
}
