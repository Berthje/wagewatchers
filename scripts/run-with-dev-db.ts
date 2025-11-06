#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import devDbUrl from "./dev-db-config";

// Usage: tsx scripts/run-with-dev-db.ts <command> [args...]
// Example: tsx scripts/run-with-dev-db.ts drizzle-kit push

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Usage: run-with-dev-db.ts <command> [args...]");
  process.exit(1);
}

// Build command as a single shell string so npm binaries (node_modules/.bin) are resolved
const cmd = args.map((a) => (a.includes(" ") ? `"${a}"` : a)).join(" ");

const env = {
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL || devDbUrl,
  NODE_ENV: process.env.NODE_ENV || "development",
};

console.log(`Running: ${cmd}`);
console.log(`Using DATABASE_URL: ${env.DATABASE_URL}`);

const result = spawnSync(cmd, { stdio: "inherit", shell: true, env });

if (typeof result.status === "number") process.exit(result.status);
if (result.error) {
  console.error(result.error);
  process.exit(1);
}
