import { listUsers as findUsers } from "../services/adminUsers.service.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listUsers = asyncHandler(async (req, res) => {
  const { items, meta } = await findUsers(req.valid.query);
  sendSuccess(res, items, { meta });
});