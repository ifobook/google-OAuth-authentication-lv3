# Secrets Authentication App

An Express web app for local account registration and login, with a Google OAuth integration. Authenticated users can access a protected page of secrets. The app renders pages with EJS, stores accounts in PostgreSQL, hashes local passwords with bcrypt, and manages sign-in sessions with Passport.

## Features

- Local registration and login
- Password hashing with bcrypt
- Google OAuth integration
- PostgreSQL account lookup and storage
- Session-based authentication
- A protected secrets page

## Requirements

- Node.js and npm
- PostgreSQL
- A Google OAuth client for Google sign-in

## Getting started

### 1. Install dependencies

From the project directory, run:

```sh
npm install
```

### 2. Create the database table

Create a PostgreSQL database, connect to it, and create the `users` table:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
);
```

The application reads and writes the `email` and `password` columns.

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
SESSION_SECRET=use-a-long-random-secret
PG_USER=your-postgres-user
PG_HOST=localhost
PG_DATABASE=your-database-name
PG_PASSWORD=your-postgres-password
PG_PORT=5432
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

Keep `.env` private; it is excluded from Git. `SESSION_SECRET` is used to sign session cookies.

### 4. Configure Google OAuth

Create an OAuth 2.0 client in Google Cloud and add this authorized redirect URI:

```text
http://localhost:3000/auth/google/secrets
```

Put the client ID and client secret in `.env`. The URI configured in Google Cloud must match the callback URL in the application.

### 5. Run the app

```sh
node index.js
```

The server listens at [http://localhost:3000](http://localhost:3000).

## Routes

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/` | Render the home page |
| GET | `/register` | Render the registration form |
| POST | `/register` | Create a local account and sign the user in |
| GET | `/login` | Render the login form |
| POST | `/login` | Authenticate a local account |
| GET | `/auth/google` | Start Google OAuth sign-in |
| GET | `/auth/google/secrets` | Handle Google's OAuth callback |
| GET | `/secrets` | Show the secrets page to authenticated users |
| GET | `/logout` | Log out and return to the home page |

## Authentication flows

### Email and password

Registration checks the submitted email, hashes the password with bcrypt, and stores the account in PostgreSQL. Local login retrieves the account by email and compares the submitted password with its stored hash.

### Google OAuth

The app requests the user's Google profile and email. On callback, it looks up an account using the profile email and reuses a matching account. For a first-time Google user, the callback currently expects the INSERT query to return the new row, but that query does not include `RETURNING *`; add it before relying on first-time Google sign-in.

## Project structure

- `index.js` — Express server, routes, database connection, and Passport strategies
- `views/` — EJS page templates
- `public/` — Static assets served by Express
- `views/partials/` — Shared EJS templates used by the pages
