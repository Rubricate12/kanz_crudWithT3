import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { type Adapter } from "next-auth/adapters"; // <--- 1. ADD THIS IMPORT
import { db } from "@/server/db";
import { type Role } from "@prisma/client";

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
  providers: [
    Credentials({
      name: "Dev Login",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "admin" },
      },
      async authorize(credentials) {
        const username = (credentials?.username as string) ?? "admin";
        const email = `${username}@example.com`;

        let user = await db.user.findFirst({ where: { email } });

        if (!user) {
          user = await db.user.create({
            data: {
              name: username,
              email: email,
              role: "CASHIER",
            },
          });
        }

        return user;
      },
    }),
  ],
  // ⬇️ 2. CAST THIS LINE
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