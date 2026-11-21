// Leonida Platinum Chartbook v6 — the hand-in program (Node 22, stdlib only).
//
// What it does: takes this repository's app/ (the guide) and screenshots/
// (its four renders) and assembles /output for the scorer, writing
// /output/dossier.json through the vendored make.fun library. It only ever
// creates directories and copies files — it never removes anything — so it
// runs cleanly when /output is the grader's bind mount.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

function handInFolder(name) {
  const from = join(repoRoot, name);
  const to = join(outputDir, name);
  mkdirSync(to, { recursive: true });
  if (existsSync(from)) cpSync(from, to, { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
handInFolder('app');
handInFolder('screenshots');

// Gate caps from the kit (reference/gate.json): the dossier text budget is
// the only one that shapes bytes; the rest refuse entries the scorer would
// refuse anyway — at most 4 screenshots of 256 KiB, app/ at most 993 entries
// and 48 MiB.
const dossierText = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outputDir, 'dossier.json'), dossierText);
