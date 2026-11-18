# Secrets Authentication App

A small Express and EJS app for registering and signing in with local credentials or Google OAuth. It stores users in PostgreSQL, hashes local passwords with bcrypt, and uses Passport sessions to protect the secrets page.

## Requirements

- Node.js
- PostgreSQL
- Google OAuth credentials (only if completing Google sign-in)

## Setup

1. Install dependencies:

   ```sh
   npm install
   ```

2. Create a PostgreSQL database and a `users` table with the columns used by the app:

   ```sql
   CREATE TABLE users (
     id SERIAL PRIMARY KEY,
     email VARCHAR(255) UNIQUE NOT NULL,
     password VARCHAR(255) NOT NULL
   );
   ```

3. Create a `.env` file in the project root:

   ```env
   SESSION_SECRET=replace-with-a-long-random-secret
   PG_USER=your-postgres-user
   PG_HOST=localhost
   PG_DATABASE=your-database-name
   PG_PASSWORD=your-postgres-password
   PG_PORT=5432
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

   Keep `.env` private; it is excluded from Git.

4. Start the server:

   ```sh
   node index.js
   ```

   The app listens on port `3000`.

## Routes

- `/` — home page
- `/register` — registration form
- `/login` — login form
- `/logout` — log out
- `/secrets` — page for authenticated users
- `/auth/google` — begins Google OAuth sign-in
- `/auth/google/secrets` — handles Google's redirect after sign-in

## Google OAuth status

The Google strategy looks up an account by the email in the Google profile and creates a database record if no matching account exists. To use it, set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`, then add `http://localhost:3000/auth/google/secrets` as an authorized redirect URI in the Google OAuth client.
