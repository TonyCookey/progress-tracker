import RequireRole from "@/components/auth/RequireRole";
import RegisterForm from "@/components/auth/RegisterForm";
import Card from "@/components/ui/Card";

export default function RegisterPage() {
  return (
    <RequireRole roles={["SUPERADMIN"]}>
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <Card className="max-w-lg w-full p-8">
          <h2 className="text-xl font-semibold text-center mb-1 text-neutral-900">Create a Leader Account</h2>
          <RegisterForm />
        </Card>
      </div>
    </RequireRole>
  );
}
