import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Admin Login",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const adminUsername = process.env.ADMIN_USERNAME;
        const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

        if (!adminUsername || !adminPasswordHash) {
          console.error(
            "Admin credentials (ADMIN_USERNAME or ADMIN_PASSWORD_HASH) are not set in environment variables."
          );
          return null;
        }

        // Validate username (exact match)
        if (credentials.username !== adminUsername) {
          return null;
        }

        // Compare password hash with bcrypt
        const isValidPassword = await bcrypt.compare(
          credentials.password,
          adminPasswordHash
        );

        if (!isValidPassword) {
          return null;
        }

        return {
          id: "admin-user",
          name: "NSES Admin",
          email: `${adminUsername}@nses.local`,
          role: "admin",
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role || "admin";
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        (session.user as { role?: string }).role = (token.role as string) || "admin";
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

/**
 * Server-side session retrieval helper
 */
export async function getServerAuthSession() {
  return await getServerSession(authOptions);
}

/**
 * Server-side API guard for Admin routes
 * Returns true if authenticated, or a 401 NextResponse if unauthorized
 */
export async function requireAdminSession(): Promise<
  { authenticated: true; session: NonNullable<Awaited<ReturnType<typeof getServerAuthSession>>> } |
  { authenticated: false; response: NextResponse }
> {
  const session = await getServerAuthSession();

  if (!session || !session.user) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { error: "Unauthorized: Admin session required" },
        { status: 401 }
      ),
    };
  }

  return {
    authenticated: true,
    session,
  };
}
