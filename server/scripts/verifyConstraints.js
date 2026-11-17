// Proves in the REAL database that the unique indexes work:  npm run db:verify
// Unit tests cannot check this, because uniqueness is enforced by MongoDB.
// It writes a few clearly named test records and always removes them.

import mongoose from "mongoose";

import {
  connectDatabase,
  disconnectDatabase,
  explainConnectionError,
} from "../src/config/db.js";
import { scrubMongoCredentials } from "../src/config/mongoUri.js";
import { Activity, Attraction, User, ensureIndexes } from "../src/models/index.js";

const HASH = `$2b$12$${"a".repeat(53)}`;
const TEST_EMAIL = "constraint-check@example.invalid";
const fakeDestination = new mongoose.Types.ObjectId();
let failures = 0;

async function expectDuplicateRejected(label, first, second) {
  await first();

  try {
    await second();
    failures += 1;
    console.log(`FAIL  ${label}: the duplicate was accepted`);
  } catch (error) {
    if (error?.code === 11000) {
      console.log(`ok    ${label}`);
    } else {
      failures += 1;
      console.log(`FAIL  ${label}: ${scrubMongoCredentials(error.message)}`);
    }
  }
}

try {
  await connectDatabase();
  await ensureIndexes();

  await expectDuplicateRejected(
    "users: the same email in a different letter case is rejected",
    () => User.create({ fullName: "Constraint Check", email: TEST_EMAIL, phone: "9800000099", passwordHash: HASH }),
    () => User.create({ fullName: "Constraint Check", email: "Constraint-Check@Example.Invalid", phone: "9800000098", passwordHash: HASH })
  );

  await expectDuplicateRejected(
    "attractions: the same name in the same destination is rejected",
    () => Attraction.create({ destination: fakeDestination, name: "Constraint Test Place", type: "Other" }),
    () => Attraction.create({ destination: fakeDestination, name: "  CONSTRAINT   test place ", type: "Other" })
  );

  const activity = (name) => ({
    destination: fakeDestination,
    name,
    category: "nature",
    durationHours: 1,
    costPerPerson: 0,
  });
  await expectDuplicateRejected(
    "activities: the same name in the same destination is rejected",
    () => Activity.create(activity("Constraint Test Walk")),
    () => Activity.create(activity("constraint  test walk"))
  );

  console.log(failures === 0 ? "Constraint check passed." : `Constraint check FAILED (${failures}).`);
  if (failures > 0) process.exitCode = 1;
} catch (error) {
  console.error(`Constraint check FAILED: ${scrubMongoCredentials(error.message)}`);
  console.error(`Hint: ${explainConnectionError(error)}`);
  process.exitCode = 1;
} finally {
  try {
    await User.deleteMany({ email: TEST_EMAIL });
    await Attraction.deleteMany({ destination: fakeDestination });
    await Activity.deleteMany({ destination: fakeDestination });
  } catch (cleanupError) {
    console.error(`Cleanup problem (check for leftover test records): ${scrubMongoCredentials(cleanupError.message)}`);
  }
  await disconnectDatabase();
}