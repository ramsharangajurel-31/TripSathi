import { getDatabaseState, pingDatabase } from "../config/db.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";

// Liveness: "the process is running". Always answers while the server is up.
export function getHealth(req, res) {
  sendSuccess(res, {
    status: "ok",
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}

// Readiness: "the server can do its job", meaning the database answers.
// Hosting platforms use this to decide whether to send traffic here.
export async function getReady(req, res) {
  const state = getDatabaseState();

  if (state !== "connected" || !(await pingDatabase())) {
    return sendError(res, 503, "NOT_READY", "The database is not reachable.", { database: state });
  }

  return sendSuccess(res, { status: "ready", database: "connected" });
}