// Applies SQL migration files in order via a generic query interface.
// Works with both PGlite (in-process, tests) and pg (server, dev+prod).

import { log } from "@project/log";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

interface Sql {
  exec(sql: string): Promise<void>;
  query(sql: string, params?: unknown[]): Promise<{ rows: unknown[] }>;
}

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "prisma", "migrations");

export async function applyMigrations(sql: Sql, info = (msg: string) => {}) {
  // Ensure migrations table exists.
  await sql.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT now()
    )
  `);

  const { readdir, readFile } = await import("node:fs/promises");
  let entries: { name: string; isDirectory: () => boolean; isFile: () => boolean }[];
  try {
    entries = await readdir(MIGRATIONS_DIR, { withFileTypes: true });
  } catch {
    info("no migrations directory — skipping");
    return;
  }

  const migrationPaths: { path: string; name: string }[] = [];

  for (const entry of entries) {
    const entryPath = join(MIGRATIONS_DIR, entry.name);

    if (entry.isDirectory()) {
      const migrationSqlPath = join(entryPath, "migration.sql");
      try {
        await readFile(migrationSqlPath, "utf-8");
        migrationPaths.push({ path: migrationSqlPath, name: entry.name });
      } catch {
        // Directory is not a Prisma migration folder; skip it.
      }
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".sql")) {
      migrationPaths.push({ path: entryPath, name: entry.name });
    }
  }

  migrationPaths.sort((a, b) => a.name.localeCompare(b.name));

  const { rows } = await sql.query("SELECT name FROM _migrations ORDER BY name");
  const applied = new Set(rows.map((r: unknown) => (r as { name: string }).name));

  for (const migration of migrationPaths) {
    if (applied.has(migration.name)) {
      info(`migration ${migration.name} already applied — skipping`);
      continue;
    }

    const migrationSql = await readFile(migration.path, "utf-8");
    await sql.exec(migrationSql);
    await sql.exec(`INSERT INTO _migrations (name) VALUES ('${migration.name.replace(/'/g, "''")}')`);
    info(`applied migration ${migration.name}`);
  }
}