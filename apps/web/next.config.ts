import type { NextConfig } from "next";
import path from "node:path";
import {fileURLToPath} from "node:url";

// Next.js only reads env files from apps/web; load the repo-root .env too.
// Skipped silently when the file doesn't exist.
try {
  process.loadEnvFile(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.env"));
} catch {}

const nextConfig: NextConfig = {
  // PGlite ships WASM; let Node load it directly instead of bundling.
  serverExternalPackages: ["@electric-sql/pglite", "pglite-prisma-adapter"],
};

export default nextConfig;
