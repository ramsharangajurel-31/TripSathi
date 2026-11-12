// Converts between an attraction (as stored) and the text values its form
// edits. The entry fee is the only tricky field: blank = unknown (stored as
// null), 0 = free, any other number = the fee in NPR.

export function emptyAttractionValues() {
  return { name: "", destinationId: "", type: "", description: "", entryFee: "" };
}

export function attractionToValues(attraction) {
  return {
    name: attraction.name || "",
    destinationId: attraction.destinationId || "",
    type: attraction.type || "",
    description: attraction.description || "",
    entryFee:
      attraction.entryFee === null || attraction.entryFee === undefined
        ? ""
        : String(attraction.entryFee),
  };
}

export function valuesToAttraction(values) {
  return {
    name: values.name.trim(),
    destinationId: values.destinationId,
    type: values.type,
    description: values.description.trim(),
    entryFee: values.entryFee === "" ? null : Number(values.entryFee),
  };
}

/** "Unknown", "Free" or "NPR 200" (formatter passed in to keep this file plain). */
export function describeEntryFee(fee, formatCurrency) {
  if (fee === null || fee === undefined) return "Unknown";
  return fee === 0 ? "Free" : formatCurrency(fee);
}