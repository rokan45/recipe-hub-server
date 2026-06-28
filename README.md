# RecipeHub — Server (Backend)

Express + MongoDB (Mongoose) + Better Auth + Stripe REST API for the RecipeHub recipe-sharing platform.

## Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- Better Auth (Google OAuth + email/password) + custom JWT (HTTPOnly cookie) for protected dashboard APIs
- Stripe (Payment Intents) for recipe purchases and premium membership
- bcryptjs for credential password hashing

## Setup

```bash
npm install
cp .env.example .env   # then fill in your real values
npm run dev             # starts on http://localhost:5000
```

### Seed the admin account

After your `.env` is filled in and MongoDB is reachable:

```bash
npm run seed:admin
```

This creates (or promotes) a user with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from your `.env` into an admin account. Log in with these credentials on the client's login page to access `/admin`.

## Environment Variables

See `.env.example` for the full list. You will need:

- A MongoDB Atlas connection string
- A Stripe secret key (test mode is fine for development)
- A Google OAuth Client ID/Secret (for Google login via Better Auth)
- Random secrets for `JWT_SECRET` and `BETTER_AUTH_SECRET` (e.g. `openssl rand -base64 32`)

## API Overview

| Resource | Base path |
|---|---|
| Better Auth (Google OAuth, sessions) | `/api/auth/*` (Better Auth's own handler) |
| Custom auth (register/login/logout/me) | `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`, `/api/auth/google-sync` |
| Recipes | `/api/recipes` |
| Favorites | `/api/favorites` |
| Reports | `/api/reports` |
| Payments / Stripe | `/api/payments` |
| Admin | `/api/admin` |
| User profile/dashboard | `/api/users` |

All protected routes read a custom JWT from an HTTPOnly cookie (`rh_token`), verified by `verifyToken` middleware. Admin-only routes additionally use `verifyAdmin`.

## Notes on Auth Design

- **Better Auth** owns Google OAuth and its own session/account collections.
- After a successful Google sign-in on the client, the client calls `POST /api/auth/google-sync` with the user's basic profile; this upserts a row in our own `users` collection and issues our custom JWT cookie.
- Credential login/register also goes through our own `users` collection (`passwordHash` via bcrypt) and issues the same JWT cookie.
- This dual approach satisfies the challenge requirement for a custom **Token Generation / HTTPOnly Cookie / Verify Middleware** flow while still using Better Auth for Google login as specified.

## Deployment (Render)

1. Push this `server` folder to its own GitHub repository.
2. On Render: New → Web Service → connect the repo.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add all variables from `.env.example` in Render's Environment tab (use your real values).
6. Set `CLIENT_URL` to your deployed Vercel client URL (no trailing slash).
7. Set `BETTER_AUTH_URL` to your Render service URL.
8. After first deploy, run the admin seed once via Render's Shell tab: `npm run seed:admin`.
