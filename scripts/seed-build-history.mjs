#!/usr/bin/env node
/**
 * Seed lib/build-history.json from real git commit history.
 *
 * Reads all [build] #N commits, deduplicates by build number (newest wins),
 * detects commit category from conventional-commit prefix, and writes
 * lib/build-history.json newest-first.
 *
 * Run once after cloning, or to backfill after a repo migration:
 *   node scripts/seed-build-history.mjs
 */

import { execSync } from "child_process";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function detectCategory(subject) {
  if (/^(feat|feature|add|new)(\(|:| |$)/i.test(subject))       return "feat";
  if (/^(fix|bug|patch|hotfix)(\(|:| |$)/i.test(subject))        return "fix";
  if (/^(improve|update|polish|enhance)(\(|:| |$)/i.test(subject)) return "improve";
  if (/^(refactor|cleanup|restructure)(\(|:| |$)/i.test(subject)) return "refactor";
  if (/^(chore|build|config|ci)(\(|:| |$)/i.test(subject))       return "chore";
  return "internal";
}

// Use NUL-delimited fields to avoid separator collisions with any character in subjects.
// Format: hash NUL ISO-timestamp NUL subject LF
const raw = execSync('git log --format=%h%x00%aI%x00%s', {
  encoding: "utf8",
  cwd: ROOT,
  // Suppress git's locale-based output transformation
  env: { ...process.env, LANG: "en_US.UTF-8", LC_ALL: "en_US.UTF-8" },
});

const seen = new Set();
const entries = [];

for (const line of raw.split("\n")) {
  if (!line.trim()) continue;
  const parts = line.split("\x00");
  if (parts.length < 3) continue;

  const [hash, isoTs, ...rest] = parts;
  const fullSubject = rest.join("\x00").trim();

  // Match [build] #N · real-subject
  const m = fullSubject.match(/^\[build\] #(\d+) [··] (.+)$/u);
  if (!m) continue;

  const build = parseInt(m[1], 10);
  if (seen.has(build)) continue; // newest occurrence wins (git log is newest-first)
  seen.add(build);

  const subject  = m[2].trim().slice(0, 120);
  const category = detectCategory(subject);
  const timestamp = new Date(isoTs).toISOString();

  entries.push({ build, timestamp, subject, hash, category });
}

// Newest first
entries.sort((a, b) => b.build - a.build);

const outPath = join(ROOT, "lib/build-history.json");
writeFileSync(outPath, JSON.stringify(entries, null, 2) + "\n");

console.log(`✓  Wrote ${entries.length} build entries to lib/build-history.json`);
for (const e of entries) {
  console.log(`   #${String(e.build).padStart(2)} [${e.category.padEnd(8)}] ${e.hash}  ${e.subject.slice(0, 60)}`);
}
