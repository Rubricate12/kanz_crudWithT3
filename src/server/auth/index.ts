import NextAuth from "next-auth";
import { cache } from "react";

// Import the config we created in the previous step
import { authConfig } from "./config";

// Initialize NextAuth
// We export 'handlers' (GET, POST) which the API route needs
// We export 'auth' which we use in Server Components to check login
export const {
  handlers,
  auth: uncachedAuth,
  signIn,
  signOut,
} = NextAuth(authConfig);

// Optional: Cache the auth() call for performance in React Server Components
export const auth = cache(uncachedAuth);