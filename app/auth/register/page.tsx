import GuestOnly from "@/components/auth/GuestOnly";
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <GuestOnly>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-lg w-full bg-white p-8 rounded shadow">
          <h2 className="text-2xl font-semibold text-center mb-1">Create an Account</h2>
          <RegisterForm />
        </div>
      </div>
    </GuestOnly>
  );
}
