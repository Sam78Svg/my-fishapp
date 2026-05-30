# PhishAware

PhishAware is a phishing awareness training platform built with React, Vite, Express, and MySQL.

It includes:
- A public landing page with feature highlights.
- A login page for admins and employees.
- An admin dashboard for creating phishing campaigns, templates, and reports.
- An employee dashboard for feedback and campaign interaction.
- A chatbot page powered by Google Gemini AI.

## Project Overview

This repository contains both frontend and backend code inside a single project:
- Frontend: `src/` using React, React Router, and Bootstrap.
- Backend: `src/components/Backend/` using Express and MySQL.
- Messaging: email via Nodemailer and SMS via Twilio.

## Quick Start

1. Open a terminal in the project folder:

```bash
cd d:\Projects\CollegeMiniProject\my-fishapp
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables in `src/components/Backend/.env`.

4. Start both frontend and backend together:

```bash
npm run dev:all
```

5. Open the app in your browser:

```text
http://localhost:3000
```

If you only want to start the backend server:

```bash
npm run server
```

## Environment Variables

The backend reads configuration from `src/components/Backend/.env`.
Set the following values before running the app:

- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `EMAIL_USER`
- `EMAIL_PASS`
- `TWILIO_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `GEMINI_API_KEY`
- `PORT` (optional)

## Available Scripts

- `npm run dev` - Start the frontend in Vite development mode.
- `npm run build` - Build the frontend for production.
- `npm run preview` - Preview the production build locally.
- `npm run lint` - Run ESLint on the project.
- `npm run server` - Start the Express backend server only.
- `npm run dev:all` - Start both frontend and backend at the same time.

## App Routes

The React app exposes these routes:

- `/` - Public landing page.
- `/login` - Login page for admins and employees.
- `/admin` - Admin dashboard.
- `/employee` - Employee dashboard.
- `/gemini` - Chatbot page.
- `/feedback/:id` - Feedback page for campaign links.
- `/about` - About page.
- `/features` - Feature details page.

## Backend API Endpoints

The backend defines API routes for authentication, campaigns, templates, reports, and messaging.

Common endpoints include:

- `POST /api/auth/login`
- `POST /api/auth/signup`
- `POST /api/save_campaign`
- `POST /api/saveLink`
- `POST /api/send_campaign`
- `GET /api/recipients`
- `GET /api/templates`
- `POST /api/templates`
- `PUT /api/templates/:id`
- `DELETE /api/templates/:id`
- `GET /api/target-groups`
- `POST /api/save_report`
- `GET /api/reports`
- `DELETE /api/clear_reports`
- `POST /api/capture`
- `POST /api/userExist`
- `POST /api/capturedUser`
- `POST /api/fetchEmail`
- `POST /api/chat`

## Project Structure

- `src/App.jsx` - Main app router and layout.
- `src/main.jsx` - React entry point.
- `src/index.css`, `src/App.css` - Global styles.
- `src/components/Frontend/` - Frontend page components.
- `src/components/Backend/` - Backend server and API modules.
- `src/components/Backend/API/` - Express API route handlers.
- `src/components/Backend/db.js` - MySQL database connection pool.
- `src/components/Backend/utils/messaging.js` - Email and SMS sending logic.
- `src/components/Styling/` - Additional page-specific CSS.
- `src/components/seo/` - SEO helpers and metadata.
- `public/` - Static public assets.

## How to Customize

- Add or update frontend pages in `src/components/Frontend/`.
- Add backend routes in `src/components/Backend/API/`.
- Update database settings in `src/components/Backend/db.js`.
- Change styles in `src/components/Styling/`.

## Notes for New Coders

- The frontend uses lazy loading for pages, so new pages should be added to `App.jsx` with `React.lazy`.
- The backend expects JSON requests, and `express.json()` is already configured.
- Email and SMS features require valid credentials in `.env`.
- Use `npm run dev:all` for the fastest local development workflow.

## Learning Resources

- React: https://reactjs.org/
- Vite: https://vitejs.dev/
- Express: https://expressjs.com/
- MySQL: https://www.mysql.com/
- Nodemailer: https://nodemailer.com/
- Twilio: https://www.twilio.com/
