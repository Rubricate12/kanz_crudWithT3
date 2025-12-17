import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/server/db";
import { type Role } from "@prisma/client";
import { type Adapter } from "next-auth/adapters";

/**
 * Module augmentation for `next-auth` types.
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role: Role;
  }
}

export const authConfig: NextAuthConfig = {
  // ---------------------------------------------------------
  // 1. THIS IS THE MISSING PIECE!
  // Tell NextAuth to use YOUR custom page, not the default one.
  // ---------------------------------------------------------
  pages: {
    signIn: "/auth/signin", 
    // error: "/auth/error", // (Optional)
  },

  providers: [
    Credentials({
      name: "Station Login",
      credentials: {
        username: { label: "Username", type: "text" },
        loginRole: { label: "Role", type: "text" } 
      },
      async authorize(credentials) {
        const username = (credentials?.username as string) ?? "admin";
        const expectedRole = (credentials?.loginRole as string) ?? ""; 
        const email = `${username}@example.com`;

        let user = await db.user.findFirst({ where: { email } });

        // Auto-create logic
        if (!user) {
          let role: Role = "CASHIER";
          if (expectedRole) role = expectedRole as Role; 
          
          user = await db.user.create({
            data: { name: username, email, role },
          });
        }

        // Strict Role Check
        if (expectedRole && user.role !== expectedRole && user.role !== "ADMIN") {
            // Return null treats it as "Invalid Credentials" (Login Failed)
            // This stops NextAuth from forcing a page reload.
            return null; 
        }

        return user;
      },
    }),
  ],
  adapter: PrismaAdapter(db) as Adapter,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
      }
      return token;
    },
    session: ({ session, token }) => {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub!,
          role: token.role as Role,
        },
      };
    },
  },
} satisfies NextAuthConfig;