#!/usr/bin/env node
// Compare live DB against database/manifest.json. Exits 1 on drift.
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(join(root, "database", "manifest.json"), "utf8"));
const url = process.env.SUPABASE_DB_URL;

if (!url) {
  console.error("✗ SUPABASE_DB_URL is not set. Add it to .env (see .env.example).");
  process.exit(1);
}

function psql(sql) {
  const r = spawnSync("psql", [url, "-tAc", sql], { encoding: "utf8" });
  if (r.status !== 0) {
    console.error("✗ psql failed:", r.stderr);
    process.exit(1);
  }
  return r.stdout.trim().split("\n").filter(Boolean);
}

const liveTables = psql("select tablename from pg_tables where schemaname='public'");
const liveFns = psql("select proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'");
const liveBuckets = psql("select id from storage.buckets");

const missing = (label, expected, actual) => {
  const miss = expected.filter((x) => !actual.includes(x));
  if (miss.length) {
    console.error(`✗ Missing ${label}: ${miss.join(", ")}`);
    return true;
  }
  console.log(`✓ ${label}: all ${expected.length} present`);
  return false;
};

let drift = false;
drift |= missing("tables", manifest.tables, liveTables);
drift |= missing("functions", manifest.functions, liveFns);
drift |= missing("storage buckets", manifest.storage_buckets, liveBuckets);

if (drift) {
  console.error("\nRun /database/full_setup.sql in the Supabase SQL Editor to repair.");
  process.exit(1);
}
console.log("\n✓ Schema matches manifest.");