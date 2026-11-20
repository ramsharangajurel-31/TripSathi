import { User } from "../models/index.js";
import { getPaging, paginationMeta } from "../utils/pagination.js";
import { escapeRegex } from "../utils/regex.js";

export function buildUserFilter(query) {
  const filter = {};

  if (query.role) filter.role = query.role;
  if (query.status) filter.status = query.status;

  if (query.q) {
    const pattern = new RegExp(escapeRegex(query.q), "i");
    filter.$or = [{ fullName: pattern }, { email: pattern }, { phone: pattern }];
  }
  return filter;
}

const SORTS = {
  name: { fullName: 1 },
  "-name": { fullName: -1 },
  email: { email: 1 },
  "-email": { email: -1 },
  createdAt: { createdAt: 1 },
  "-createdAt": { createdAt: -1 },
};

/** Everyone's account, without passwords (passwordHash is never selected). */
export async function listUsers(query) {
  const { page, limit, skip } = getPaging(query);
  const filter = buildUserFilter(query);
  const sort = { ...(SORTS[query.sort] ?? SORTS["-createdAt"]), _id: 1 };

  const [items, total] = await Promise.all([
    User.find(filter).sort(sort).collation({ locale: "en" }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return { items, meta: paginationMeta(page, limit, total) };
}