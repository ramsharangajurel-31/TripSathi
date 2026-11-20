// "Today" for planner tests: trips in March 2027 are always in the future.
export const TODAY = "2027-01-01";

// A valid set of requirements: 4 days in Pokhara for 3 adults on a budget.
export const validInput = (overrides = {}) => ({
  startingLocation: "Kathmandu",
  destinationIds: ["pokhara"],
  departureDate: "2027-03-10",
  returnDate: "2027-03-13",
  adults: 3,
  children: 0,
  budgetTotal: 45000,
  budgetCategory: "budget",
  interests: ["nature", "adventure", "photography"],
  preferences: { accommodation: "hotel", transport: "tourist-bus", intensity: "moderate", pace: "balanced" },
  ...overrides,
});

export const fieldsOf = (errors) => errors.map((error) => error.field);