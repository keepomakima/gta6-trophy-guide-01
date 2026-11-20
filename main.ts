// Leonida Trophy Compass v4 — the entry program (Node 22 standard library only).
//
// It copies app/ and screenshots/ into the output directory and writes
// /output/dossier.json with the kit's buildDossier library.
//
// It never deletes the output directory: the grader runs this program with
// /output as a bind mount, and removing a bind mount fails (EBUSY), which
// would end the grade run with exit code 1. Creating the directory and
// copying over it is all this program ever needs to do.

import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoDir = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoDir, 'app'), join(outputDir, 'app'), { recursive: true });
cpSync(join(repoDir, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
