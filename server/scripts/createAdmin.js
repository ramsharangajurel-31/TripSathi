// Creates (or promotes) an administrator:  npm run admin:create
//   npm run admin:create -- --promote   also allow turning an existing
//                                       traveler account into an administrator
//
// Interactive: it asks for each value, and the password is not shown.
// Automated (a host or a deploy script): set ADMIN_NAME, ADMIN_EMAIL,
// ADMIN_PHONE and ADMIN_PASSWORD. Remove them afterwards, because
// environment variables can be visible in shell history and process lists.
// The password is never printed or logged.

import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

import {
  connectDatabase,
  disconnectDatabase,
  explainConnectionError,
} from "../src/config/db.js";
import { scrubMongoCredentials } from "../src/config/mongoUri.js";
import { User } from "../src/models/index.js";
import { ensureAdmin } from "../src/services/adminAccount.service.js";
import { adminPasswordField, emailField, fullNameField, phoneField } from "../src/validators/auth.js";

class Abort extends Error {}
const fail = (message) => {
  throw new Abort(message);
};

const promote = process.argv.includes("--promote");

async function ask(question) {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

// Reads a line without echoing it. Falls back to a visible prompt when input
// is piped (there is no terminal to hide it in).
function askHidden(question) {
  if (!stdin.isTTY) return ask(question);

  return new Promise((resolve) => {
    stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    let value = "";
    const onData = (chunk) => {
      for (const char of chunk) {
        if (char === "\r" || char === "\n") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          stdout.write("\n");
          resolve(value);
          return;
        }
        if (char === "\u0003") {
          stdout.write("\n");
          process.exit(130); // Ctrl+C
        }
        if (char === "\u007f" || char === "\b") {
          value = value.slice(0, -1);
          continue;
        }
        value += char;
      }
    };
    stdin.on("data", onData);
  });
}

async function collect({ label, schema, fromEnv, hidden = false }) {
  if (fromEnv) {
    const parsed = schema.safeParse(fromEnv);
    if (!parsed.success) fail(`${label}: ${parsed.error.issues[0].message}`);
    return parsed.data;
  }

  if (!stdin.isTTY) {
    fail(`${label} is required. Set the environment variable, or run this in an interactive terminal.`);
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const answer = await (hidden ? askHidden : ask)(`${label}: `);
    const parsed = schema.safeParse(answer);
    if (parsed.success) return parsed.data;
    console.log(`  ${parsed.error.issues[0].message}`);
  }
  return fail(`Too many invalid attempts for ${label}.`);
}

try {
  await connectDatabase();

  const email = await collect({ label: "Email", schema: emailField, fromEnv: process.env.ADMIN_EMAIL });
  const existing = await User.findOne({ email });

  let details = { email, promote };

  if (existing?.role === "admin") {
    console.log(`${email} is already an administrator. Nothing to do.`);
  } else if (existing) {
    if (!promote) {
      fail(
        `${email} already belongs to a traveler account. Run "npm run admin:create -- --promote" to make it an administrator (its password stays as it is).`
      );
    }
    details = { email, promote };
  } else {
    const fullName = await collect({ label: "Full name", schema: fullNameField, fromEnv: process.env.ADMIN_NAME });
    const phone = await collect({ label: "Mobile number (10 digits)", schema: phoneField, fromEnv: process.env.ADMIN_PHONE });
    const password = await collect({
      label: "Password (at least 12 characters, with a letter and a number)",
      schema: adminPasswordField,
      fromEnv: process.env.ADMIN_PASSWORD,
      hidden: true,
    });

    if (!process.env.ADMIN_PASSWORD && stdin.isTTY) {
      const again = await askHidden("Repeat the password: ");
      if (again !== password) fail("The two passwords do not match.");
    }
    details = { fullName, email, phone, password, promote };
  }

  if (!existing || existing.role !== "admin") {
    const result = await ensureAdmin(details);
    console.log(
      result.action === "created"
        ? `Administrator created: ${email}`
        : `${email} is now an administrator. Its password was not changed.`
    );
    console.log("You can sign in with it now. Keep the password somewhere safe: it cannot be recovered.");
  }
} catch (error) {
  if (error instanceof Abort || error?.code === "EMAIL_TAKEN") {
    console.error(error.message);
  } else {
    console.error(`Could not create the administrator: ${scrubMongoCredentials(error.message)}`);
    console.error(`Hint: ${explainConnectionError(error)}`);
  }
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}