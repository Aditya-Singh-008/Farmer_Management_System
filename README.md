[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Aditya-Singh-008/Farmer_Management_System)
<<<<<<< HEAD
# Smart Farmer Management System (SFMS)

Modern, Supabase-backed dashboard that helps farmers monitor crops, fields, inventory, marketplace listings, and analytics from one responsive web interface.
=======
#🌾 Smart Farmer Management System (SFMS)
#Working url:https://farmer-management-system-mjse.vercel.app
### 🚀 Overview
**Smart Farmer Management System (SFMS)** is a cloud-based DBMS project designed to help farmers efficiently manage farm data, crop cycles, resources, and sales — all from one unified platform.
>>>>>>> d9870531b672415e590538007157cf55b6233195

## Features

- **Dashboard** – at-a-glance weather signals, crop growth charts, upcoming tasks, and crop cards.
- **Auth Flows** – responsive login, signup, and password reset pages with Supabase integration and demo credentials.
- **Modules** – dedicated pages for crops, fields, inventory, marketplace, and reports; each mirrors the dashboard layout and supports demo data.
- **Edge Functions** – documented Supabase functions (`get-dashboard`, `get-crops`, etc.) for secure data access via JWT.
- **Demo Mode** – localStorage toggle plus automatic fallback alerts whenever live data is unavailable.

## Tech Stack

| Layer        | Technology                                     |
|--------------|------------------------------------------------|
| Frontend     | HTML5, CSS (custom + theme.css), vanilla JS    |
| Data Layer   | Supabase (PostgreSQL + Auth + Edge Functions)  |
| Charts       | Chart.js                                       |
| Deployment   | Static hosting (e.g., Vercel via `vercel.json`)|

## Project Structure

```
public/
  index.html, crops.html, fields.html, inventory.html, marketplace.html, report.html
  src/
    css/      # page-level styles, shared theme + sidebar styles
    js/       # app bootstrap, API client, modules, utilities, Supabase client, etc.
docs/
  EDGE_FUNCTIONS_*.md, FRONTEND_INTEGRATION_PLAN.md, TESTING_AND_DEPLOYMENT.md
```

See `docs/tree.txt` for an annotated breakdown of intended subdirectories.

## Environment Configuration

The frontend no longer ships hard-coded Supabase credentials. Inject runtime values *before* loading `public/src/js/supabase.js`, for example:

```html
<script>
  window.__SUPABASE_CONFIG__ = {
    url: 'https://YOUR_PROJECT.supabase.co',
    anonKey: 'YOUR_PUBLIC_ANON_KEY'
  };
  window.__ENV = {
    EDGE_FUNCTION_BASE_URL: 'https://YOUR_PROJECT.functions.supabase.co',
    SERVICE_ROLE_TOKEN: 'OPTIONAL_SERVICE_ROLE_JWT_FOR_EDGE_FUNCTIONS'
  };
</script>
```

> **Note:** Edge Functions like `/login` require a bearer token even before the user authenticates. Provide a restricted service-role token (or other gateway token) via `window.__ENV.SERVICE_ROLE_TOKEN` or `window.__SUPABASE_SERVICE_TOKEN__` so the client can call those endpoints securely.

Authentication tokens are expected to be stored in `sessionStorage.sessionToken` (set during login). When no token is available, the UI automatically enters demo mode and shows a banner explaining that only sample data is visible.

## Running Locally

1. Serve the `public/` folder with any static server (VS Code Live Server, `npx serve`, etc.).
2. Configure Supabase credentials as described above.
3. Sign up/login via the hosted forms to populate `sessionStorage`, or toggle demo mode from the browser console:
   ```js
   FarmerAPI.toggleDemoMode();
   ```

## Testing & Deployment

- Refer to `docs/TESTING_AND_DEPLOYMENT.md` for Postman scripts, browser QA checklists, and Vercel instructions.
- `vercel.json` routes `/` to `public/login.html` and exposes the rest of the static bundle without a build step.

## Security Notes

- Never embed service-role keys or JWTs in the client bundle. Instead, rely on Supabase auth tokens stored per session.
- All Edge Functions require Authorization headers; the helper in `public/src/js/api.js` now refuses to call them without a token and emits demo-mode fallback events for the UI.
