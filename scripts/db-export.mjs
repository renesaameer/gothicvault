#!/usr/bin/env node
// Dump live schema for diffing. Requires `pg_dump` on PATH and SUPABASE_DB_URL.
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "database", "_exported_schema.sql");
const url = process.env.SUPABASE_DB_URL;

if (!url) {
  console.error("✗ SUPABASE_DB_URL is not set. Add it to .env (see .env.example).");
  process.exit(1);
}

const r = spawnSync("pg_dump", ["--schema-only", "--no-owner", "--no-privileges", "-f", out, url], {
  stdio: "inherit",
});
if (r.status !== 0) {
  console.error("✗ pg_dump failed. Install Postgres client tools (`pg_dump`) and retry.");
  process.exit(r.status ?? 1);
}
console.log(`✓ Schema exported → ${out}`);