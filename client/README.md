# TripSathi – Your Intelligent Travel Companion

**AI-Powered Tourism Itinerary and Budget Optimization System in Nepal**
Final-year BIM project. This folder is the **frontend only**: a complete,
working prototype built on mock data and `localStorage`. The backend, database,
AI and real service integrations come in a later phase.

TripSathi is a planning and decision-support tool. It is **not** a booking
site: it does not book hotels, flights or tours, and it takes no payments.

---

## 1. Run it

You need a current LTS version of [Node.js](https://nodejs.org) (the Vite
version in `package.json` states the minimum).

```bash
cd client
npm install
npm run dev        # development server (prints a local address)
```

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create the production build in `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Check the code with ESLint (should print nothing) |

To open the app on a phone on the same Wi-Fi: `npm run dev -- --host`.

---

## 2. Demo accounts

| Role | Email | Password | Opens |
|---|---|---|---|
| Traveler | `demo@tripsathi.com` | `Demo@1234` | Traveler dashboard |
| Administrator | `admin@tripsathi.com` | `Admin@1234` | Admin panel |

The login page also has a "Demo accounts" box with one-click fill.
You can register new traveler accounts at `/register`.

> **This is a demonstration, not real security.** Accounts and passwords are
> kept in the browser's `localStorage` in plain text, and "login" only checks
> that list. Never use real passwords. The backend phase replaces all of this
> with hashed passwords and JWT. Before any real deployment, delete
> `src/data/demoUsers.js` and the "Demo accounts" box in `src/pages/Login.jsx`.

---

## 3. What is in the app

### Public website
- Landing page: hero, natural-language trip box, popular and featured
  destinations, how it works, why TripSathi, call to action
- Login and registration with full validation, show/hide password, password
  strength meter, "remember me"
- Responsive navigation with a mobile menu

### Traveler dashboard (`/dashboard`)
- Overview: statistics, upcoming and past trips, quick actions, profile card,
  recommended destinations
- **Trip wizard** (5 steps): destinations and dates, budget and travelers,
  interests, preferences, review. Per-step validation, progress bar, draft
  saved automatically, review with edit shortcuts
- **Itinerary results**: overview, budget breakdown (Recharts), day-by-day
  timeline, route summary, sample weather, alternative suggestions
- **Editing**: trip details, add / edit / remove / move / reorder activities,
  activity costs and notes, day notes. Totals update live
- **What-if simulator**: change budget, trip length, group size,
  accommodation, transport, intensity, pace and unticked activities. Shows
  simulated costs against the current plan; can be saved as a new trip
- **Compare**: two itineraries side by side with a plain-language summary
- **Saved trips**: search, sort, pagination, remove from saved, delete
- **Print / Save as PDF** through the browser's print dialog (no PDF library)
- Notifications (read / unread, mark all, delete) and profile (details,
  change password)

### Admin panel (`/admin`)
- Overview: counts, four charts, recent users and activity
- Manage **destinations**, **attractions** and **activities**: search,
  filters, sorting, pagination, add, edit, delete, details, image upload or
  address
- Manage **users**: search, filters, details, activate / deactivate, delete
  with confirmation. An administrator cannot deactivate or delete their own
  account

### Quality
- Responsive from 1440 px down to 375 px; tables become labelled cards on
  phones
- Keyboard accessible, visible focus, skip link, labelled forms, accessible
  dialogs (focus trap, Escape, focus return), reduced-motion support
- Loading, empty and error states; an error boundary; lazy-loaded pages

---

## 4. How the data works

Everything is stored in the browser. Nothing is sent anywhere.

| Key | Holds |
|---|---|
| `tripsathi.users` | All accounts (including demo accounts) |
| `tripsathi.session` | Signed-in user when "Remember me" is on (otherwise `sessionStorage`) |
| `tripsathi.trips` | All trips of all accounts |
| `tripsathi.notifications` | All notifications |
| `tripsathi.tripDraft.<userId>` | An unfinished trip wizard |
| `tripsathi.admin.destinations`, `.attractions`, `.activities` | The admin's own copy of the catalog |

**Admin catalog edits do not change the traveler pages.** The admin starts
with a copy of the same data and keeps changes separately. (The admin user
list is the exception: it is the real list of accounts.)

**Start again from the original demo data.** In the browser console:

```js
Object.keys(localStorage).filter((k) => k.startsWith("tripsathi.")).forEach((k) => localStorage.removeItem(k)); sessionStorage.clear(); location.href = "/";
```

localStorage holds about 5 MB per site. Uploaded images are resized, but many
uploads can fill it.

### Folder structure

```
src/
  components/   common/ (shared), ui/ (buttons, inputs ...), home/, dashboard/, trip/, admin/
  context/      AuthContext (demo login, session)
  data/         destinations, activities, sample trips, options, admin seed data, navigation
  hooks/        useAuth, useTrips, useNotifications, useTripForm, useAdminData ...
  layouts/      MainLayout, PanelLayout (shared), DashboardLayout, AdminLayout
  pages/        public + traveler pages; pages/admin/ for the admin pages
  routes/       AppRoutes (all routes, lazy loaded)
  styles/       variables, global, components, layout, per-area stylesheets, responsive
  utils/        cost model, itinerary generator, route estimates, what-if, validation ...
```

---

## 5. Important: how the numbers are produced

- **All prices are sample estimates** for demonstration, in NPR. They are not
  live prices. Verify any figure before quoting it.
- **No AI is used.** Itineraries come from a **rule-based planner**
  (`src/utils/tripGenerator.js`) that orders destinations, spreads days, and
  picks activities by interest, intensity and pace. The same input always
  gives the same itinerary.
- **Cost model** (`src/utils/tripUtils.js`, one place for every page):
  costs are per person per day; children count as 50%; a 5% miscellaneous
  buffer is added.
- **Routes** are estimates from sample distances and fares. There is no live
  routing and no map.
- **Weather** is a seasonal model (typical Kathmandu temperatures adjusted for
  altitude), clearly labelled "Sample data". It is not a forecast.
- **What-if results** are deterministic calculations, labelled "simulated
  estimates".
- The free-text trip description is **saved but not interpreted** yet.
- Limits: 4 destinations per trip, 30 days, travelers up to 20 adults and 10
  children, starting cities Kathmandu, Pokhara, Chitwan and Lumbini.

---

## 6. Still needs the backend

| Area | What the backend phase must provide |
|---|---|
| **Authentication** | Hashed passwords, JWT, refresh/expiry, server-side role checks, "forgot password" email. Replace `AuthContext` internals; page code keeps the same function names |
| **Database** | Users, trips, notifications, destinations, attractions, activities (MongoDB). The hooks (`useTrips`, `useNotifications`, `useAdminData`, `useAdminUsers`) are the single place to swap `localStorage` for Axios calls |
| **Validation** | Repeat every client-side check on the server. Never trust the browser |
| **AI** | An LLM service to understand the natural-language description, and a real optimisation algorithm behind `generateTrip()` (same inputs and result shape) |
| **Weather and maps** | A weather API in place of the seasonal model; a map or routing service in place of the route summary. Keep API secrets on the server |
| **Catalog** | Admin changes to destinations, attractions and activities flowing to traveler pages, with rules for trips that use a deleted destination |
| **Images** | Real image storage (uploads are currently small copies kept in the browser) |
| **Notifications** | Created by the server (for example a budget alert), not by the browser |
| **Audit trail** | The admin "recent activity" feed is built from creation dates; a real log is needed |
| **Security hygiene** | Rate limiting, HTTPS, secure cookies or token storage, removal of the demo accounts |

`axios` is installed and ready for the service layer. `framer-motion` is
installed but not used yet (the interface uses plain CSS transitions), and is
kept for later.

---

## 7. Technology

React · Vite · JavaScript (JSX) · React Router · plain CSS (design tokens in
`src/styles/variables.css`) · Recharts · React Icons · React Toastify ·
Axios (not yet used) · Framer Motion (not yet used)

Fonts: Inter (Google Fonts). Photo credit: Phewa Lake, Pokhara, by Kaushal
Subedi on Unsplash. Other destination photos are added by the owner (see
`src/data/destinations.js`).

## 8. Adding destination photos

Put images in `public/images/` using the names in `src/data/destinations.js`
(for example `kathmandu.jpg`), about 1000–1600 px wide and under 400 KB. For
the home page hero add `public/images/hero.jpg`. Without a photo, a plain
placeholder is shown.