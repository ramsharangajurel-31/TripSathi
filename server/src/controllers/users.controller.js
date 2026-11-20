import * as userService from "../services/user.service.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { setAuthCookies } from "../utils/cookies.js";

export const getProfile = (req, res) => {
  sendSuccess(res, { user: req.user });
};

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.valid.body);
  sendSuccess(res, { user });
});

// New cookies: every other session was ended, this device stays signed in.
export const changePassword = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await userService.changePassword(
    req.user._id,
    req.valid.body,
    req.get("user-agent")
  );
  setAuthCookies(res, { accessToken, refreshToken });
  sendSuccess(res, { user });
});