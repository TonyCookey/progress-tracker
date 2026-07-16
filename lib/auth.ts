import type { NextAuthOptions, Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcrypt";
import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password || user.deletedAt) return null;

        const isValid = await compare(credentials.password, user.password);
        if (!isValid) return null;

        return user;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    async session({ session, token }) {
      if (token?.sub) {
        const user = await prisma.user.findUnique({ where: { id: token.sub } });
        if (user) {
          session.user.id = user.id;
          session.user.username = user.username;
          session.user.role = user.role;
          session.user.baseId = user.baseId;
        }
      }
      return session;
    },
  },
};

export function getSession() {
  return getServerSession(authOptions);
}

export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string[]>;

  constructor(status: number, message: string, fieldErrors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    // `message` is included alongside `error` for compatibility with existing
    // client code that reads `data.message` from error responses.
    return NextResponse.json(
      { error: error.message, message: error.message, fieldErrors: error.fieldErrors },
      { status: error.status },
    );
  }

  console.error("[API_ERROR]", error);
  return NextResponse.json({ error: "Internal Server Error", message: "Internal Server Error" }, { status: 500 });
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session?.user) {
    throw new ApiError(401, "Unauthorized");
  }

  // A user deactivated after their JWT was issued must lose access immediately,
  // not just be blocked from signing in again — re-check on every request.
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { deletedAt: true } });
  if (!user || user.deletedAt) {
    throw new ApiError(401, "Unauthorized");
  }

  return session;
}

export async function requireRole(roles: UserRole[]): Promise<Session> {
  const session = await requireSession();
  if (!roles.includes(session.user.role as UserRole)) {
    throw new ApiError(403, "Forbidden");
  }
  return session;
}

/**
 * Non-SUPERADMIN users may only mutate data scoped to their own base.
 * A null/undefined baseId (cross-base data) is SUPERADMIN-only.
 */
export function assertBaseAccess(session: Session, baseId: string | null | undefined) {
  if (session.user.role === "SUPERADMIN") return;

  if (!baseId || baseId !== session.user.baseId) {
    throw new ApiError(403, "You do not have access to this base");
  }
}
