import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import mongoose from "mongoose";

/**
 * Better Auth handles:
 *  - Google OAuth login flow
 *  - Credential login (email/password) as a secondary path
 *  - Its own session/account/verification collections in MongoDB
 */

// database connection
const getDb = () => {
  const client = mongoose.connection.getClient();
  return client.db();
};

const isProduction = process.env.NODE_ENV === "production";

export const auth = betterAuth({
  database: mongodbAdapter(getDb()),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [process.env.CLIENT_URL],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  advanced: {
    useSecureCookies: isProduction,
    defaultCookieAttributes: {
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      httpOnly: true,
    },
  },
});
