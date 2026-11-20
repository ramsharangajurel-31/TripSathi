import * as catalog from "../services/catalog.service.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listDestinations = asyncHandler(async (req, res) => {
  const { items, meta } = await catalog.listDestinations(req.valid.query);
  sendSuccess(res, items, { meta });
});

export const searchDestinations = asyncHandler(async (req, res) => {
  const { items, meta } = await catalog.searchDestinations(req.valid.query);
  sendSuccess(res, items, { meta });
});

export const getDestination = asyncHandler(async (req, res) => {
  sendSuccess(res, await catalog.getDestination(req.valid.params.id));
});

export const listAttractions = asyncHandler(async (req, res) => {
  const { items, meta } = await catalog.listAttractions(req.valid.query);
  sendSuccess(res, items, { meta });
});

export const getAttraction = asyncHandler(async (req, res) => {
  sendSuccess(res, await catalog.getAttraction(req.valid.params.id));
});

export const listActivities = asyncHandler(async (req, res) => {
  const { items, meta } = await catalog.listActivities(req.valid.query);
  sendSuccess(res, items, { meta });
});

export const getActivity = asyncHandler(async (req, res) => {
  sendSuccess(res, await catalog.getActivity(req.valid.params.id));
});