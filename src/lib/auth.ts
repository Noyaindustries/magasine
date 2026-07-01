import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { getAuthSecret, isGoogleAuthEnabled } from "@/lib/auth-secret";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import type { UserRole } from "@/types";
import {
  DEFAULT_ADMIN_EMAIL,
  ensureDefaultAdmin,
} from "@/lib/ensure-admin";

const SECURITY_REFRESH_MS = 60_000;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function findUserByEmail(email: string) {
  const normalized = normalizeEmail(email);
  let user = await User.findOne({ email: normalized });
  if (user) return user;

  user = await User.findOne({
    email: { $regex: new RegExp(`^${normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
  });

  if (user && user.email !== normalized) {
    user.email = normalized;
    await user.save();
  }

  return user;
}

function applyUserToToken(
  token: Record<string, unknown>,
  user: { id?: string; role?: UserRole; isPremium?: boolean }
) {
  if (user.id) token.id = user.id;
  if (user.role) token.role = user.role;
  if (user.isPremium !== undefined) token.isPremium = user.isPremium;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
      role: UserRole;
      isPremium: boolean;
    };
  }

  interface User {
    role: UserRole;
    isPremium: boolean;
  }

  interface JWT {
    id: string;
    role: UserRole;
    isPremium: boolean;
    lastSecurityCheck?: number;
    sessionRevoked?: boolean;
  }
}

const providers: NonNullable<NextAuthConfig["providers"]> = [
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;

      const email = normalizeEmail(credentials.email as string);
      const password = (credentials.password as string).trim();

      try {
        await connectDB();

        let user = await findUserByEmail(email);
        let isValid =
          !!user?.password && (await bcrypt.compare(password, user.password));

        if (
          !isValid &&
          process.env.NODE_ENV === "development" &&
          email === DEFAULT_ADMIN_EMAIL.toLowerCase()
        ) {
          await ensureDefaultAdmin({ resetPassword: true });
          user = await findUserByEmail(email);
          isValid =
            !!user?.password && (await bcrypt.compare(password, user.password));
        }

        if (!user?.password || !isValid) return null;
        if (user.isBanned) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          isPremium: user.isPremium,
        };
      } catch (error) {
        console.error("[auth] credentials authorize failed:", error);
        return null;
      }
    },
  }),
];

if (isGoogleAuthEnabled()) {
  providers.unshift(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  );
}

const authSecret = getAuthSecret();
if (!authSecret && process.env.NODE_ENV === "production") {
  console.error(
    "[auth] AUTH_SECRET or NEXTAUTH_SECRET is missing — /api/auth/session will return 500 in production."
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        try {
          await connectDB();
          const email = normalizeEmail(user.email);
          const existing = await User.findOne({ email });
          if (!existing) {
            await User.create({
              name: user.name ?? "Lecteur",
              email,
              image: user.image ?? undefined,
              role: "reader",
            });
          }
        } catch (error) {
          console.error("[auth] google signIn failed:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        try {
          await connectDB();
          const dbUser = await findUserByEmail(user.email ?? "");
          if (dbUser) {
            applyUserToToken(token, {
              id: dbUser._id.toString(),
              role: dbUser.role,
              isPremium: dbUser.isPremium,
            });
          } else {
            applyUserToToken(token, user);
          }
        } catch (error) {
          console.error("[auth] jwt callback failed:", error);
          applyUserToToken(token, user);
        }
      }

      if (trigger === "update" && session) {
        token.isPremium = session.user?.isPremium ?? token.isPremium;
      }

      if (!user && token.id && !token.sessionRevoked) {
        const lastCheck = (token.lastSecurityCheck as number) ?? 0;
        if (Date.now() - lastCheck > SECURITY_REFRESH_MS) {
          try {
            await connectDB();
            const dbUser = await User.findById(token.id as string)
              .select("role isPremium isBanned")
              .lean();
            if (!dbUser || dbUser.isBanned) {
              token.sessionRevoked = true;
            } else {
              token.role = dbUser.role;
              token.isPremium = dbUser.isPremium;
              token.sessionRevoked = false;
            }
            token.lastSecurityCheck = Date.now();
          } catch (error) {
            console.error("[auth] jwt security refresh failed:", error);
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token.sessionRevoked) {
        return { expires: new Date(0).toISOString() };
      }

      if (session.user) {
        session.user.id = (token.id as string) ?? "";
        session.user.role = (token.role as UserRole) ?? "reader";
        session.user.isPremium = Boolean(token.isPremium);
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  secret: authSecret,
  trustHost: true,
  debug: process.env.NODE_ENV === "development",
});
