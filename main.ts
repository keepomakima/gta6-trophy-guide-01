// Platinum Leonida — the entrypoint (Node 22, standard library only).
//
// What this program hands in: the guide itself lives in app/ as plain static
// files (index.html, style.css, ES modules under js/, and the 55 trophies with
// their guides in data/trophies.json), and the four screenshots of it live in
// screenshots/. This file copies both folders into the output directory and
// writes dossier.json there with the vendored make.fun library, so the judge
// gets the screenshots, the first load's files and bytes, and the source.
// vendor/makefun-frontend.ts is the kit's copy and is left exactly as it is:
// the scorer rebuilds the dossier with its own copy and compares byte for byte.
//
// Run it outside the grader with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// The repository root is the folder beside this file; the grader writes to
// /output, and MAKEFUN_OUTPUT_DIR stands in for it anywhere else.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTree(source, target) {
  cpSync(source, target, { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
copyTree(join(repoRoot, 'app'), join(outputDir, 'app'));
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  copyTree(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'));
}

// The scorer's own caps (from the kit's reference gate): the text cap shapes
// the dossier's bytes, and the rest refuse an entry the scorer would refuse —
// more than 4 screenshots or one over 256 KiB, more than 993 files and
// directories in app/ or 48 MiB of app files (app/ counts beside /output's
// own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
