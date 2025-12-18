import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/server/db";
import { type Role } from "@prisma/client";
import { type Adapter } from "next-auth/adapters";
import { compare } from "bcryptjs"; // Ensure you installed this: npm i bcryptjs

/**
 * Type Augmentation
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
  pages: {
    signIn: "/auth/signin", 
  },

  providers: [
    Credentials({
      name: "Station Login",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        loginRole: { label: "Role", type: "text" } 
      },
      async authorize(credentials) {
        const username = credentials?.username as string;
        const password = credentials?.password as string;
        const expectedRole = credentials?.loginRole as string; 

        // 1. Basic Validation
        if (!username || !password) return null;

        // 2. Find User by Email
        const email = `${username}@kanz.com`; 
        const user = await db.user.findUnique({ where: { email } });

        // ---------------------------------------------------------
        // CRITICAL FIX: REMOVED AUTO-CREATE LOGIC
        // If user doesn't exist, we return null (Login Failed)
        // ---------------------------------------------------------
        if (!user) {
            console.log("User not found:", email);
            return null;
        }

        // 3. Password Check (Secure)
        const isValidPassword = await compare(password, user.password);
        if (!isValidPassword) {
            console.log("Invalid Password for:", username);
            return null;
        }

        // 4. Role Integrity Check
        // Prevents a "Cashier" from logging in as "Admin"
        if (expectedRole && user.role !== expectedRole && user.role !== "ADMIN") {
            console.log(`Role Mismatch: Expected ${expectedRole}, got ${user.role}`);
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