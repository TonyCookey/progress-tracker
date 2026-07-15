import RequireRole from "@/components/auth/RequireRole";
import SettingsTabs from "@/components/settings/SettingsTabs";

export default function SettingsPage() {
  return (
    <RequireRole roles={["SUPERADMIN"]}>
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">Settings</h1>
        <SettingsTabs />
      </div>
    </RequireRole>
  );
}
