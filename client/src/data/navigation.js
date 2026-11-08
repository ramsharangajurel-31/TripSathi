// Navigation links shared by the Navbar and Footer.
// Hash links ("/#destinations") point to sections of the home page.

export const PUBLIC_NAV_LINKS = [
  { label: "Home", to: "/", end: true },
  { label: "Destinations", to: "/#destinations" },
  { label: "How it works", to: "/#how-it-works" },
  { label: "Features", to: "/#features" },
];

export const FOOTER_LINK_GROUPS = [
  {
    title: "Explore",
    links: [
      { label: "Home", to: "/" },
      { label: "Destinations", to: "/#destinations" },
      { label: "How it works", to: "/#how-it-works" },
      { label: "Why TripSathi", to: "/#features" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Log in", to: "/login" },
      { label: "Create account", to: "/register" },
      { label: "Plan a trip", to: "/dashboard/create-trip" },
    ],
  },
  {
    title: "Travel tools",
    links: [
      { label: "Itinerary planner", to: "/dashboard/create-trip" },
      { label: "Budget estimates", to: "/#features" },
      { label: "What-if simulator", to: "/#features" },
    ],
  },
];