import { ReactNode } from "react";

// Shared frame for the signed-out screens (login, forgot, reset).
export default function AuthShell({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-accent-50 via-neutral-50 to-neutral-100 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-500 text-lg font-extrabold text-white shadow-soft">DA</div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>}
        </div>
        <div className="rounded-card border border-neutral-200 bg-white p-6 shadow-soft sm:p-8">{children}</div>
      </div>
    </div>
  );
}
