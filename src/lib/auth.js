import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import mongoose from "mongoose";

/**
 * Better Auth handles:
 *  - Google OAuth login flow
 *  - Credential login (email/password) as a secondary path
 *  - Its own session/account/verification collections in MongoDB
 *
 * In addition to Better Auth's own session, our custom JWT
 * (see middleware/verifyToken.js) is issued by our /api/auth/jwt-login
 * route and stored in an HTTPOnly cookie, satisfying the challenge
 * requirement of "Token Generation / HTTPOnly Cookie / Verify Middleware".
 */

const getDb = () => {
  const client = mongoose.connection.getClient();
  return client.db();
};

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
      maxAge: 60 * 5, // 5 minutes
    },
  },
});
