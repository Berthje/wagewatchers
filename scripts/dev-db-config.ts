// Central development database URL.
// Edit this file to change the local development DATABASE_URL used by helper scripts.
// It will prefer the DEV_DATABASE_URL environment variable if set (CI or local overrides).
const DEV_DATABASE_URL =
  process.env.DEV_DATABASE_URL || "postgresql://postgres:postgres@localhost:5433/wagewatchers";

export default DEV_DATABASE_URL;
