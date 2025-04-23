import GuestOnly from "@/components/auth/GuestOnly";

export default function RegisterPage() {
  return (
    <GuestOnly>
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-4">Register</h1>
        {/* Optional: Create account (if allowed) */}
      </div>
    </GuestOnly>
  );
}
