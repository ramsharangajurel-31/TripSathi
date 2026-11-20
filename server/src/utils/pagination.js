/** Reads page and limit from validated input and works out how many rows to skip. */
export function getPaging(valid, defaultLimit = 20) {
  const page = valid.page ?? 1;
  const limit = valid.limit ?? defaultLimit;
  return { page, limit, skip: (page - 1) * limit };
}

export const paginationMeta = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});