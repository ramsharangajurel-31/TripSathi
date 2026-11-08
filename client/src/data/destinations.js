// ==========================================================================
// TripSathi – Destination data (single source of truth)
//
// Used by: home page, trip creation form, itinerary results, dashboard
// recommendations, and the admin "Manage Destinations" page.
//
// All costs are SAMPLE ESTIMATES in NPR, per person per day, assuming two
// travellers share a room. They are for demonstration and will be replaced
// by real data from the backend. Distances and times are approximate.
// ==========================================================================

// ---------- Images ----------
// Fill these in with your own photos or image URLs. While a value is empty
// (or fails to load) the SafeImage component shows a branded fallback.
//
//  - Local file:  import it, or put it in /public/images and use "/images/pokhara.jpg"
//  - Unsplash:    open a photo, right-click the image, "Copy image address",
//                 then append  ?auto=format&fit=crop&w=1000&q=80
export const DESTINATION_IMAGES = {
  kathmandu: "/images/kathmandu.jpg",
  // Photo: Kaushal Subedi on Unsplash (Phewa Lake fishing boats, Pokhara)
  pokhara:
    "https://images.unsplash.com/photo-1612151234759-ea52a758e4f1?auto=format&fit=crop&w=1000&q=80",
  chitwan: "/images/chitwan.jpg",
  lumbini: "/images/lumbini.jpg",
  bandipur: "/images/bandipur.jpg",
  mustang: "/images/mustang.jpg",
  nagarkot: "/images/nagarkot.jpg",
  ilam: "/images/ilam.jpg",
  ghandruk: "/images/ghandruk.jpg",
  "everest-region": "/images/everest-region.jpg",
};

// ---------- Travel interests (shared with the trip form) ----------
export const INTERESTS = [
  { id: "adventure", label: "Adventure" },
  { id: "nature", label: "Nature" },
  { id: "culture", label: "Culture" },
  { id: "historical", label: "Historical places" },
  { id: "food", label: "Food" },
  { id: "relaxation", label: "Relaxation" },
  { id: "wildlife", label: "Wildlife" },
  { id: "photography", label: "Photography" },
  { id: "trekking", label: "Trekking" },
  { id: "religious", label: "Religious tourism" },
];

export const BUDGET_TIERS = ["budget", "standard", "premium"];

export const ESTIMATE_DISCLAIMER =
  "Costs are sample estimates for demonstration, not live prices.";

// ---------- Destinations ----------
// costPerDay: NPR per person per day, by budget tier
// fromKathmandu: approximate road/air access from Kathmandu
const destinations = [
  {
    id: "kathmandu",
    name: "Kathmandu",
    province: "Bagmati Province",
    tagline: "Temples, old squares and living heritage",
    description:
      "Nepal's capital is a dense mix of UNESCO World Heritage Sites, medieval palaces, busy markets and some of the country's best food. It is the usual starting point for any trip in Nepal.",
    image: DESTINATION_IMAGES.kathmandu,
    interests: ["culture", "historical", "religious", "food", "photography"],
    highlights: [
      "Pashupatinath Temple",
      "Boudhanath Stupa",
      "Swayambhunath",
      "Kathmandu Durbar Square",
    ],
    bestSeason: "Oct – Nov, Mar – Apr",
    altitudeM: 1400,
    recommendedDays: 3,
    rating: 4.6,
    popular: true,
    featured: false,
    costPerDay: {
      budget: { stay: 1200, food: 900, localTransport: 300 },
      standard: { stay: 3000, food: 1800, localTransport: 600 },
      premium: { stay: 9000, food: 4000, localTransport: 1500 },
    },
    fromKathmandu: { distanceKm: 0, hours: 0, mode: "Starting point" },
  },
  {
    id: "pokhara",
    name: "Pokhara",
    province: "Gandaki Province",
    tagline: "Lakeside calm beneath the Annapurna range",
    description:
      "A relaxed lakeside city with mountain views, paragliding, boating and easy access to treks. It suits travellers who want both adventure and downtime.",
    image: DESTINATION_IMAGES.pokhara,
    interests: ["nature", "adventure", "relaxation", "photography", "trekking"],
    highlights: [
      "Phewa Lake",
      "World Peace Pagoda",
      "Sarangkot sunrise",
      "Paragliding",
    ],
    bestSeason: "Sep – Nov, Feb – May",
    altitudeM: 820,
    recommendedDays: 4,
    rating: 4.8,
    popular: true,
    featured: false,
    costPerDay: {
      budget: { stay: 1000, food: 800, localTransport: 300 },
      standard: { stay: 2800, food: 1600, localTransport: 700 },
      premium: { stay: 8000, food: 3500, localTransport: 1800 },
    },
    fromKathmandu: {
      distanceKm: 200,
      hours: 7,
      mode: "Tourist bus or private car (flight about 30 min)",
    },
  },
  {
    id: "chitwan",
    name: "Chitwan",
    province: "Bagmati Province",
    tagline: "Jungle safaris and one-horned rhinos",
    description:
      "Chitwan National Park is one of Asia's best places to see wildlife, including rhinos, deer and many bird species. Jeep safaris, canoe rides and Tharu cultural shows are the main activities.",
    image: DESTINATION_IMAGES.chitwan,
    interests: ["wildlife", "nature", "adventure", "culture", "photography"],
    highlights: [
      "Chitwan National Park jeep safari",
      "Rapti River canoe ride",
      "Elephant Breeding Centre",
      "Tharu cultural show",
    ],
    bestSeason: "Oct – Mar",
    altitudeM: 150,
    recommendedDays: 3,
    rating: 4.5,
    popular: true,
    featured: false,
    costPerDay: {
      budget: { stay: 1200, food: 900, localTransport: 400 },
      standard: { stay: 3500, food: 1800, localTransport: 900 },
      premium: { stay: 10000, food: 4000, localTransport: 2000 },
    },
    fromKathmandu: {
      distanceKm: 170,
      hours: 5,
      mode: "Tourist bus or private car",
    },
  },
  {
    id: "lumbini",
    name: "Lumbini",
    province: "Lumbini Province",
    tagline: "The birthplace of Lord Buddha",
    description:
      "A UNESCO World Heritage Site and major pilgrimage destination. Monasteries built by Buddhist communities from many countries surround the sacred garden.",
    image: DESTINATION_IMAGES.lumbini,
    interests: ["religious", "historical", "culture", "relaxation"],
    highlights: [
      "Maya Devi Temple",
      "Ashoka Pillar",
      "Monastic Zone",
      "Lumbini Museum",
    ],
    bestSeason: "Oct – Mar",
    altitudeM: 150,
    recommendedDays: 2,
    rating: 4.4,
    popular: true,
    featured: false,
    costPerDay: {
      budget: { stay: 900, food: 700, localTransport: 250 },
      standard: { stay: 2500, food: 1400, localTransport: 600 },
      premium: { stay: 6500, food: 3000, localTransport: 1500 },
    },
    fromKathmandu: {
      distanceKm: 280,
      hours: 9,
      mode: "Bus or private car (flight to Bhairahawa about 35 min)",
    },
  },
  {
    id: "bandipur",
    name: "Bandipur",
    province: "Gandaki Province",
    tagline: "A preserved Newari hill town",
    description:
      "A quiet ridge-top bazaar with traditional architecture, no heavy traffic, and wide Himalayan views. Good for a slow overnight stop between Kathmandu and Pokhara.",
    image: DESTINATION_IMAGES.bandipur,
    interests: ["culture", "relaxation", "nature", "photography", "food"],
    highlights: [
      "Bandipur Bazaar",
      "Siddha Cave",
      "Thani Mai Temple",
      "Tundikhel viewpoint",
    ],
    bestSeason: "Oct – Apr",
    altitudeM: 1030,
    recommendedDays: 2,
    rating: 4.5,
    popular: false,
    featured: true,
    costPerDay: {
      budget: { stay: 1000, food: 800, localTransport: 250 },
      standard: { stay: 2800, food: 1500, localTransport: 600 },
      premium: { stay: 6000, food: 3000, localTransport: 1500 },
    },
    fromKathmandu: {
      distanceKm: 145,
      hours: 4.5,
      mode: "Bus or private car",
    },
  },
  {
    id: "mustang",
    name: "Mustang",
    province: "Gandaki Province",
    tagline: "A high-altitude desert and ancient Tibetan culture",
    description:
      "Dry, wind-carved landscapes, cave monasteries and Tibetan-style villages beyond the Himalayan rain shadow. Jomsom and Muktinath are the common bases.",
    image: DESTINATION_IMAGES.mustang,
    interests: ["adventure", "culture", "trekking", "photography", "religious"],
    highlights: [
      "Jomsom",
      "Muktinath Temple",
      "Kagbeni village",
      "Kali Gandaki gorge",
    ],
    bestSeason: "Mar – Jun, Sep – Nov",
    altitudeM: 2720,
    recommendedDays: 5,
    rating: 4.7,
    popular: false,
    featured: true,
    costPerDay: {
      budget: { stay: 1800, food: 1200, localTransport: 800 },
      standard: { stay: 4000, food: 2200, localTransport: 1800 },
      premium: { stay: 9000, food: 4000, localTransport: 3500 },
    },
    fromKathmandu: {
      distanceKm: 330,
      hours: 10,
      mode: "Usually via Pokhara, then a short flight or long jeep ride to Jomsom",
    },
  },
  {
    id: "nagarkot",
    name: "Nagarkot",
    province: "Bagmati Province",
    tagline: "Sunrise views close to the capital",
    description:
      "A hill station on the Kathmandu Valley rim known for sunrise and sunset views of the Himalayas. A convenient overnight trip or short escape from the city.",
    image: DESTINATION_IMAGES.nagarkot,
    interests: ["nature", "photography", "relaxation", "trekking"],
    highlights: [
      "Sunrise viewpoint",
      "Nagarkot–Changu Narayan hike",
      "Himalayan panorama",
      "Hill-top resorts",
    ],
    bestSeason: "Oct – Mar",
    altitudeM: 2175,
    recommendedDays: 2,
    rating: 4.3,
    popular: false,
    featured: true,
    costPerDay: {
      budget: { stay: 1200, food: 900, localTransport: 300 },
      standard: { stay: 3000, food: 1700, localTransport: 700 },
      premium: { stay: 8000, food: 3500, localTransport: 1700 },
    },
    fromKathmandu: {
      distanceKm: 32,
      hours: 1.5,
      mode: "Bus, taxi or private car",
    },
  },
  {
    id: "ilam",
    name: "Ilam",
    province: "Koshi Province",
    tagline: "Rolling tea gardens in eastern Nepal",
    description:
      "Green hills covered in tea estates, with cool weather, local cheese and views toward Kanchenjunga on clear days. A quiet, scenic region far from the usual routes.",
    image: DESTINATION_IMAGES.ilam,
    interests: ["nature", "photography", "relaxation", "food"],
    highlights: [
      "Ilam tea gardens",
      "Antu Danda sunrise",
      "Kanyam tea estate",
      "Mai Pokhari",
    ],
    bestSeason: "Oct – Nov, Mar – Apr",
    altitudeM: 1200,
    recommendedDays: 3,
    rating: 4.4,
    popular: false,
    featured: true,
    costPerDay: {
      budget: { stay: 800, food: 600, localTransport: 300 },
      standard: { stay: 2000, food: 1200, localTransport: 700 },
      premium: { stay: 5000, food: 2500, localTransport: 1500 },
    },
    fromKathmandu: {
      distanceKm: 620,
      hours: 6,
      mode: "Flight to Bhadrapur (about 50 min) plus road (about 5 h)",
    },
  },
  {
    id: "ghandruk",
    name: "Ghandruk",
    province: "Gandaki Province",
    tagline: "A Gurung village with Annapurna views",
    description:
      "A traditional stone-built Gurung village on the Annapurna trekking routes. It is a popular short trek with warm local hospitality and clear mountain views.",
    image: DESTINATION_IMAGES.ghandruk,
    interests: ["trekking", "culture", "nature", "photography"],
    highlights: [
      "Gurung Museum",
      "Annapurna South views",
      "Stone-paved village trail",
      "Poon Hill route access",
    ],
    bestSeason: "Mar – May, Oct – Nov",
    altitudeM: 1940,
    recommendedDays: 3,
    rating: 4.6,
    popular: false,
    featured: true,
    costPerDay: {
      budget: { stay: 700, food: 900, localTransport: 300 },
      standard: { stay: 1800, food: 1500, localTransport: 600 },
      premium: { stay: 4500, food: 2500, localTransport: 1200 },
    },
    fromKathmandu: {
      distanceKm: 230,
      hours: 9,
      mode: "Via Pokhara, then drive to Nayapul and a jeep or short trek",
    },
  },
  {
    id: "everest-region",
    name: "Everest Region",
    province: "Koshi Province",
    tagline: "Sherpa villages beneath the world's highest peak",
    description:
      "The Khumbu region offers Nepal's most famous treks, including Everest Base Camp. Most visitors fly to Lukla and walk through Sherpa villages and monasteries. A permit and good fitness are required.",
    image: DESTINATION_IMAGES["everest-region"],
    interests: ["trekking", "adventure", "nature", "photography", "culture"],
    highlights: [
      "Everest Base Camp trek",
      "Namche Bazaar",
      "Tengboche Monastery",
      "Sagarmatha National Park",
    ],
    bestSeason: "Mar – May, Sep – Nov",
    altitudeM: 2860,
    recommendedDays: 12,
    rating: 4.9,
    popular: false,
    featured: true,
    costPerDay: {
      budget: { stay: 1000, food: 1500, localTransport: 600 },
      standard: { stay: 3000, food: 2500, localTransport: 1200 },
      premium: { stay: 9000, food: 4500, localTransport: 2500 },
    },
    fromKathmandu: {
      distanceKm: 140,
      hours: 0.6,
      mode: "Flight to Lukla (about 35 min), then trek",
    },
  },
];

export default destinations;

// ---------- Helpers ----------
export const getDestinationById = (id) =>
  destinations.find((destination) => destination.id === id) || null;

export const getPopularDestinations = () =>
  destinations.filter((destination) => destination.popular);

export const getFeaturedDestinations = () =>
  destinations.filter((destination) => destination.featured);

// Estimated cost per person per day for one destination and budget tier.
export const getDailyCost = (destination, tier = "standard") => {
  const costs = destination?.costPerDay?.[tier];
  if (!costs) return 0;
  return costs.stay + costs.food + costs.localTransport;
};