import { Router } from "express";

// API routes are registered here, one router per feature, as they are built
// (auth, destinations, trips ...). The health route is mounted separately in
// app.js so that monitoring is never rate limited.
const router = Router();

export default router;