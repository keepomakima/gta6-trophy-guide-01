// Leonida Trophy Compass v5 — headless-Chrome playtest + screenshots.
// Uses puppeteer-core (installed in the work dir) and the ms-playwright Chrome.
// Usage: node tools/playtest.mjs
// Serves app/ on :8123, runs the checks, writes screenshots/*.jpg, exits
// non-zero on any failure. Screenshots are taken of a lived-in state (11
// trophies earned, PMA counter at 6) so the cover shows the tool in use;
// the shipped app itself starts empty.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const WORK = join(process.env.HOME, 'workspace/makefun/gta6-trophy-guide-01-work/playtest');
const DL = join(WORK, 'dl-v5');
const PROFILE = join(WORK, 'chrome-profile-v5');
const CHROME = process.env.HOME + '/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome';
const BASE = 'http://localhost:8123/app/';

const require = createRequire(import.meta.url);
const puppeteer = require(join(WORK, 'node_modules/puppeteer-core'));

const failures = [];
const notes = [];
function check(name, ok, extra = '') {
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + (extra ? ' — ' + extra : ''));
  if (!ok) failures.push(name);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(fn, timeout = 8000, label = 'condition') {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try { if (await fn()) return true; } catch { /* retry */ }
    await sleep(150);
  }
  throw new Error('timeout waiting for ' + label);
}

mkdirSync(DL, { recursive: true });
for (const f of readdirSync(DL)) rmSync(join(DL, f), { force: true });

const server = spawn('node', ['serve.ts', '--port', '8123'], { cwd: ROOT, stdio: 'ignore' });
const errors = [];
let browser;
try {
  await waitFor(async () => {
    try { const r = await fetch(BASE); return r.ok; } catch { return false; }
  }, 10000, 'server up');

  browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--window-size=1280,800'],
    userDataDir: PROFILE,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('dialog', async (d) => { await d.accept(); });

  const cdp = await page.createCDPSession();
  try {
    await cdp.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: DL });
  } catch {
    await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: DL });
  }

  await page.goto(BASE, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.waitForSelector('#trophyList li', { timeout: 10000 });
  await sleep(400);

  // Start clean: the Chrome profile persists between runs.
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForSelector('#trophyList li', { timeout: 10000 });
  await sleep(400);
  const clean0 = await page.$eval('#earnedLine', (el) => el.textContent);
  check('starts clean at 0 / 55', clean0.startsWith('0 / 55'), clean0);

  // 1. All 55 rows render.
  const rows = await page.$$eval('#trophyList li', (els) => els.length);
  check('55 checklist rows render', rows === 55, rows + ' rows');

  // 2. Audit strip numbers are computed from the data.
  const audit = await page.$eval('#auditStrip', (el) => el.textContent);
  for (const [label, needle] of [
    ['audit: 55/55 cite a source', '55/55 guides cite a source'],
    ['audit: 123/123 steps cited', '123/123 steps cited'],
    ['audit: 9 disagree', '9 disagree'],
    ['audit: 1 unconfirmed', '1 unconfirmed'],
    ['audit: 4 single-source', '4 single-source'],
    ['audit: 12 watch', '12 watch'],
    ['audit: 1 possibly missable', '1 possibly missable'],
    ['audit: 28 hidden', '28 hidden'],
    ['audit: ~200h', '200h to platinum'],
  ]) check(label, audit.includes(needle), audit.slice(0, 200));

  // 3. Default detail is the missable trophy, steps + citations above the fold.
  const detailText = await page.$eval('#detail', (el) => el.textContent);
  check('default detail is Positive Mental Attitude', detailText.includes('Positive Mental Attitude'));
  check('detail shows MISSABLE badge', detailText.includes('MISSABLE'));
  check('detail shows numbered steps', (await page.$$('#detail .steps li')).length === 4);
  check('detail shows inline citations', detailText.includes('[2]') && detailText.includes('[3]'));
  check('detail shows counter 0 / 18', detailText.includes('0') && detailText.includes('18 meditations'));

  // 4. Spoiler mask (default): a hidden trophy row shows "Hidden trophy".
  const hiddenRow = await page.$eval('#trophyList', (ul) => {
    const rows = [...ul.querySelectorAll('li')];
    const row = rows.find((li) => li.textContent.includes('Hidden trophy'));
    return row ? row.textContent.slice(0, 60) : null;
  });
  check('spoiler mask hides hidden names by default', !!hiddenRow, hiddenRow || 'no masked row');

  // 5. Search works.
  await page.type('#q', 'meditation');
  await sleep(300);
  const searchRows = await page.$$eval('#trophyList li', (els) => els.length);
  check('search "meditation" narrows the list', searchRows >= 1 && searchRows < 55, searchRows + ' rows');
  await page.$eval('#q', (el) => { el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await sleep(200);

  // 6. Kind filter: story = 12.
  await page.select('#fKind', 'story');
  await sleep(300);
  const storyRows = await page.$$eval('#trophyList li', (els) => els.length);
  check('kind filter story shows 12', storyRows === 12, storyRows + ' rows');
  await page.select('#fKind', 'all');
  await sleep(200);

  // 7. Sort by name: first visible row starts with "A".
  await page.select('#fSort', 'name');
  await sleep(300);
  const firstName = await page.$eval('#trophyList li .tname', (el) => el.textContent);
  check('sort by name puts A first', firstName.trim().startsWith('A '), firstName.trim().slice(0, 40));
  await page.select('#fSort', 'route');
  await sleep(200);

  // 8. Toggle persists after reload.
  const tick = async (n) => {
    for (let i = 0; i < n; i++) {
      await page.evaluate(() => {
        const box = document.querySelector('#trophyList input[type=checkbox]:not(:checked)');
        if (box) box.click();
      });
      await sleep(150);
    }
  };
  await tick(3);
  await sleep(300);
  const earned3 = await page.$eval('#earnedLine', (el) => el.textContent);
  check('toggling 3 trophies updates counter', earned3.startsWith('3 / 55'), earned3);
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForSelector('#trophyList li', { timeout: 10000 });
  await sleep(300);
  const earnedAfterReload = await page.$eval('#earnedLine', (el) => el.textContent);
  check('toggles persist after reload', earnedAfterReload.startsWith('3 / 55'), earnedAfterReload);

  // 9. Counter +/- persists.
  await page.evaluate(() => {
    document.querySelector('#trophyList li').click();
  });
  await sleep(300);
  for (let i = 0; i < 6; i++) {
    await page.evaluate(() => document.querySelector('[data-counter="1"]').click());
    await sleep(120);
  }
  const counterText = await page.$eval('#detail .counter-box .count', (el) => el.textContent);
  check('counter reaches 6 / 18', counterText.includes('6') && counterText.includes('18'), counterText);
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForSelector('#trophyList li', { timeout: 10000 });
  await sleep(300);
  const counterAfter = await page.$eval('#detail .counter-box .count', (el) => el.textContent);
  check('counter persists after reload', counterAfter.includes('6'), counterAfter);

  // 10. Export a real file, wipe, import it back.
  await page.click('#btnExport');
  await waitFor(() => existsSync(join(DL, 'leonida-trophy-compass-progress.json')), 8000, 'export download');
  const exported = JSON.parse(readFileSync(join(DL, 'leonida-trophy-compass-progress.json'), 'utf8'));
  check('export file holds 3 earned + counter 6',
    Object.keys(exported.earned || {}).length === 3 && exported.counters['positive-mental-attitude'] === 6,
    JSON.stringify(exported).slice(0, 120));
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForSelector('#trophyList li', { timeout: 10000 });
  await sleep(300);
  const wiped = await page.$eval('#earnedLine', (el) => el.textContent);
  check('wipe clears progress', wiped.startsWith('0 / 55'), wiped);
  const input = await page.$('#fileImport');
  await input.uploadFile(join(DL, 'leonida-trophy-compass-progress.json'));
  await sleep(600);
  const restored = await page.$eval('#earnedLine', (el) => el.textContent);
  check('import restores 3 earned', restored.startsWith('3 / 55'), restored);
  const restoredCounter = await page.$eval('#detail .counter-box .count', (el) => el.textContent);
  check('import restores counter 6', restoredCounter.includes('6'), restoredCounter);

  // 11. Tabs render.
  await page.evaluate(() => document.querySelector('[data-view="route"]').click());
  await sleep(300);
  const routeGroups = await page.$$eval('#routeGroups .group', (els) => els.length);
  check('route planner shows 6 groups', routeGroups === 6, routeGroups + ' groups');
  await page.evaluate(() => document.querySelector('[data-view="roadmap"]').click());
  await sleep(300);
  const phases = await page.$$eval('#roadmapPhases .phase-card', (els) => els.length);
  check('roadmap shows 5 phases', phases === 5, phases + ' phases');
  await page.evaluate(() => document.querySelector('[data-view="sources"]').click());
  await sleep(300);
  const matrixRows = await page.$$eval('#sourceMatrix table.matrix tbody tr', (els) => els.length);
  const disagreeCards = await page.$$eval('#sourceMatrix .disagree-card', (els) => els.length);
  check('source matrix lists 5 sources', matrixRows === 5, matrixRows + ' rows');
  check('sources view shows 9 disagreement cards + 3 honesty labels', disagreeCards === 12, disagreeCards + ' cards');

  // 12. Lived-in state for the cover, then 4 screenshots.
  await page.evaluate(() => document.querySelector('[data-view="guide"]').click());
  await sleep(300);
  await tick(8); // 3 + 8 = 11 earned
  await sleep(300);
  await page.evaluate(() => {
    const first = document.querySelector('#trophyList li');
    if (first) first.click();
  });
  await sleep(400);
  const shot = async (file) => {
    const path = join(ROOT, 'screenshots', file);
    await page.screenshot({ path, type: 'jpeg', quality: 80 });
    const bytes = statSync(path).size;
    console.log(`SHOT  ${file} — ${bytes} bytes`);
    check('screenshot ' + file + ' under 256 KiB', bytes <= 262144, bytes + ' bytes');
    return bytes;
  };
  mkdirSync(join(ROOT, 'screenshots'), { recursive: true });
  await shot('1-cover.jpg');
  await page.evaluate(() => document.querySelector('[data-view="route"]').click());
  await sleep(300);
  await shot('2-route.jpg');
  await page.evaluate(() => document.querySelector('[data-view="roadmap"]').click());
  await sleep(300);
  await shot('3-roadmap.jpg');
  await page.evaluate(() => document.querySelector('[data-view="sources"]').click());
  await sleep(300);
  await shot('4-sources.jpg');

  // 13. Zero console errors across the whole run.
  check('0 console/page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
} catch (err) {
  failures.push('exception: ' + err.message);
  console.log('EXCEPTION ' + (err.stack || err.message));
} finally {
  if (browser) await browser.close();
  server.kill();
}

console.log(failures.length === 0 ? 'ALL CHECKS PASSED' : 'FAILURES: ' + failures.join(' ; '));
process.exit(failures.length === 0 ? 0 : 1);
