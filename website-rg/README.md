# website-rg

Full-stack site for a small company with role-based access: public pages, member dashboard, and admin panel. Backend uses Express + MongoDB with JWT auth; frontend is static HTML/CSS/JS.

## Features

- Public projects listing
- Login with JWT
- Roles: member and admin
- Admin can create/update/delete projects
- Admin can schedule events, generate invite templates, and email team members
- Guest registrations require email verification via signed links

## Getting Started

1. Backend install

```bash
cd backend
npm install
npm run seed # creates default admin users
npm run dev
```

The API runs on `http://localhost:4010` by default.

Ensure MongoDB is running locally before seeding or starting the server. You can launch a disposable instance with Docker:

```powershell
docker run --name company-site-mongo -p 27017:27017 -d mongo:6
```

### Using MongoDB Atlas (managed cluster)

1. In the Atlas UI, create a database user with read/write access and note the credentials.
2. Whitelist your development machine's IP address (or allow from anywhere while testing).
3. Copy the "Connect your application" URI; it will look similar to:
   ```
   mongodb+srv://USERNAME:PASSWORD@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```
4. Update `website-rg/backend/.env` with the URI and target database name:
   ```
   MONGO_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   MONGO_DB_NAME=company_site
   ```
   URL-encode any special characters in the username or password (e.g., replace `@` with `%40`).
5. Restart the backend (`npm run dev`) so it reconnects to Atlas.
6. Run `npm run seed` once to create the default admin accounts inside the cluster.

2) Frontend

Open the files in `frontend/` with a simple static server or via file://. For best results, serve with a local server:

```bash
# For example using npx http-server from repo root (optional)
npx --yes http-server website-rg/frontend -p 5173
```

Then visit `http://localhost:5173`.

## Environment

`backend/.env` (optional):

```
PORT=4010
JWT_SECRET=change-me
MONGO_URI=mongodb://127.0.0.1:27017
MONGO_DB_NAME=company_site
# Absolute origin used in verification emails (defaults to protocol/host of request)
APP_BASE_URL=http://localhost:5173
# Email verification expiry (hours) and resend throttle (minutes)
EMAIL_VERIFICATION_TTL_HOURS=48
EMAIL_VERIFICATION_RESEND_INTERVAL_MINUTES=2
# Email delivery (required for event invites)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey-or-username
SMTP_PASS=your-smtp-password
MAIL_FROM="Small Company" <no-reply@example.com>
# Comma-separated list of inboxes for contact form submissions
CONTACT_FORM_RECIPIENTS=hello@smallcompany.org
```

With SMTP credentials in place, new guest sign-ups send an email containing a link to `verify.html` with a one-time token. The frontend calls `GET /api/auth/verify/guest?token=...` to finalize the account. Unverified guests cannot log in; attempting to do so resends a fresh verification email (respecting the resend interval). Ensure `APP_BASE_URL` points to the publicly reachable origin that serves the frontend so the verification link directs users correctly.

Contact form submissions POST to `/api/contact` and are relayed to every address in `CONTACT_FORM_RECIPIENTS`. If that variable is absent, the server falls back to known team member inboxes or the configured SMTP user.

## API

- POST `/api/auth/login` { email, password }
- GET `/api/auth/me` with `Authorization: Bearer <token>`
- GET `/api/projects`
- POST `/api/projects` (admin)
- PUT `/api/projects/:id` (admin)
- DELETE `/api/projects/:id` (admin)
- GET `/api/events` (admin)
- POST `/api/events` (admin)
- DELETE `/api/events/:id` (admin)
- POST `/api/events/:id/send` (admin) — send email invites to the event team
