export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center text-center bg-neutral-50">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Welcome to the DA Progress Tracker</h1>
        <p className="mt-4 text-neutral-600">
          Please{" "}
          <a className="text-accent-600 underline" href="/auth/login">
            login
          </a>{" "}
          to continue.
        </p>
      </div>
    </main>
  );
}
