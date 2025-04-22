export default function HomePage() {
    return (
      <main className="min-h-screen flex items-center justify-center text-center">
        <div>
          <h1 className="text-4xl font-bold">Welcome to the DA Progress Tracker</h1>
          <p className="mt-4 text-gray-600">Please <a className="text-blue-500 underline" href="/auth/login">login</a> to continue.</p>
        </div>
      </main>
    )
  }
  