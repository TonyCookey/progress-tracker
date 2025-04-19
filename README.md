# DA Progress Tracker

This project uses Next.js, Prisma, NextAuth.js, and Tailwind CSS to build a progress tracking system for DA

## 🛠 Tech Stack

- Next.js 14 (App Router)
- Prisma + PostgreSQL
- NextAuth.js (Email/Password auth)
- Tailwind CSS + shadcn/ui

## 📦 Setup Instructions

1. Clone the project

2. Install dependencies:

```bash
 npm install
```

3. Setup environment variables:
   Create a `.env` file and copy over the content of .env.example and populate with appropiate credentials

4. Run migrations & seed the database:

```bash
npx prisma migrate dev --name init
npx prisma db seed

```

5. Run the development server:

```bash
npm dev
```

## 🧪 Seed Script

Located at `prisma/seed.ts` to populate initial data.
