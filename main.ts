// Leonida Platinum Field Guide — a gta6-trophy-guide-01 entry (Node 22, stdlib only).
// The guide is this directory's app/ folder: plain static files a browser opens
// at app/index.html (one ES module, CSS, a JSON data file, no build step), fully
// offline: it loads nothing over the network, and its trophy list and original
// guides are app/data/trophies.json. The program hands it in: it copies app/ and
// screenshots/ from beside this file to /output and writes /output/dossier.json,
// the summary the judge reads, with the vendored make.fun library.
//
// The grader runs `node main.ts` with /output as a bind mount, so this file must
// never delete or replace the output directory itself: mkdirSync with
// recursive:true is safe on a mount point, rmSync on it throws EBUSY and fails
// the run (that is exactly what killed the v2 entry's grade run). Files inside
// /output are simply overwritten by cpSync.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Never rmSync the output directory: on the grader it is a bind mount and
// removing it throws "Device or resource busy". mkdirSync is safe on a mount.
mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the others refuse an entry the scorer would refuse (more than 4
// screenshots or one over 256 KiB; more than 993 files and directories in app/
// or 48 MiB of app files).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
