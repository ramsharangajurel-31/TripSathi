// Converts between a catalog activity (as stored) and the text values its
// form edits.

export function emptyActivityValues() {
  return {
    name: "",
    destinationId: "",
    category: "",
    description: "",
    durationHours: "2",
    costPerPerson: "",
    intensity: "easy",
    bestTime: "morning",
  };
}

const text = (value) => (value === null || value === undefined ? "" : String(value));

export function activityToValues(activity) {
  return {
    name: activity.name || "",
    destinationId: activity.destinationId || "",
    category: activity.category || "",
    description: activity.description || "",
    durationHours: text(activity.durationHours),
    costPerPerson: text(activity.costPerPerson),
    intensity: activity.intensity || "easy",
    bestTime: activity.bestTime || "morning",
  };
}

// Keys are in the same order as the seed data, so an unchanged activity
// converts back to an identical object.
export function valuesToActivity(values) {
  return {
    destinationId: values.destinationId,
    name: values.name.trim(),
    description: values.description.trim(),
    category: values.category,
    durationHours: Number(values.durationHours),
    costPerPerson: Number(values.costPerPerson),
    intensity: values.intensity,
    bestTime: values.bestTime,
  };
}

/** 0.5 -> "30 min", 1 -> "1 hour", 2.5 -> "2.5 hours" */
export function describeDuration(hours) {
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  return `${hours} ${hours === 1 ? "hour" : "hours"}`;
}