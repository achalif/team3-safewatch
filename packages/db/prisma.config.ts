import path from "node:path";
import fs from "node:fs";
import { defineConfig } from "prisma/config";

// The Prisma CLI (validate/generate/migrate) reads schema.prisma directly and
// does its own env("DATABASE_URL") lookup — it never runs packages/db/src/client.ts,
// so the LOCAL_DEV_URL fallback there doesn't apply here. Load the repo-root .env
// explicitly so `DATABASE_URL` (when set) resolves the same way it would for the app.
const rootEnvPath = path.resolve(import.meta.dirname, "../../.env");
if (fs.existsSync(rootEnvPath)) {
  process.loadEnvFile(rootEnvPath);
}

// Same default local Postgres URL as packages/db/src/client.ts, so the CLI
// resolves DATABASE_URL the same way the app does when it's left unset.
process.env.DATABASE_URL ??= "postgresql://postgres:postgres@127.0.0.1:5433/postgres";

export default defineConfig({
  schema: "prisma/schema",
});
