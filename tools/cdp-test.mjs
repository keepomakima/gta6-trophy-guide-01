// Leonida Trophy Compass v4 — headless-Chrome playtest + screenshots over CDP.
// Uses only Node's standard library (global WebSocket) and /opt/meta-chromium/chrome.
// Usage: node tools/cdp-test.mjs
// Writes screenshots/*.jpg, prints PASS/FAIL lines, exits non-zero on failure.
import { spawn } from 'node:child_process';
import { writeFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CHROME = process.env.HOME + '/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome';
const DEBUG_PORT = 9223;
const BASE = 'http://localhost:8123/app/index.html';
const PROFILE = '/tmp/chrome-v4-profile';

const failures = [];
const notes = [];
function check(name, ok, extra = '') {
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + (extra ? ' — ' + extra : ''));
  if (!ok) failures.push(name);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getWsUrl() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://localhost:${DEBUG_PORT}/json/list`);
      const targets = await res.json();
      const page = targets.find((t) => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch { /* not up yet */ }
    await sleep(250);
  }
  throw new Error('chrome devtools did not come up');
}

let msgId = 0;
const pending = new Map();
let ws;
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    const timer = setTimeout(() => {
      if (pending.has(id)) { pending.delete(id); reject(new Error('CDP timeout after 15s: ' + method)); }
    }, 15000);
    pending.set(id, { resolve: (v) => { clearTimeout(timer); resolve(v); }, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
function failAllPending(err) {
  for (const [id, p] of pending) { pending.delete(id); p.reject(err); }
}
async function evalJs(expression) {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error('page exception: ' + JSON.stringify(r.exceptionDetails).slice(0, 400));
  return r.result.value;
}
async function navigate(url) {
  await send('Page.navigate', { url });
  await sleep(1800);
}
async function shot(path, quality = 80) {
  const r = await send('Page.captureScreenshot', { format: 'jpeg', quality });
  writeFileSync(path, Buffer.from(r.data, 'base64'));
  const bytes = statSync(path).size;
  console.log(`SHOT  ${path} — ${bytes} bytes`);
  return bytes;
}

const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${DEBUG_PORT}`,
  `--user-data-dir=${PROFILE}`,
  '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
  '--window-size=1280,1000', 'about:blank',
], { stdio: 'ignore' });

try {
  const wsUrl = await getWsUrl();
  ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onclose = () => failAllPending(new Error('CDP websocket closed'));
  const consoleErrors = [];
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      pending.get(m.id).resolve(m.result || {});
      pending.delete(m.id);
    }
    if (m.method === 'Runtime.exceptionThrown') {
      consoleErrors.push('exception: ' + JSON.stringify(m.params.exceptionDetails).slice(0, 300));
    }
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
      consoleErrors.push('console.error: ' + JSON.stringify(m.params.args).slice(0, 300));
    }
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') {
      consoleErrors.push('log: ' + m.params.entry.text.slice(0, 300));
    }
  };
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Log.enable');

  // ---- screenshots first (fresh demo state: 13/55 earned) ----
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 1000, deviceScaleFactor: 1, mobile: false });
  await navigate(BASE + '?demo=1#/trophy/positive-mental-attitude');
  await evalJs(`window.scrollTo(0, 0); 'ok'`);
  check('cover: 13/55 progress shown', (await evalJs(`document.getElementById('progressBig').textContent`)) === '13 / 55 earned');
  check('cover: PMA detail open', (await evalJs(`document.querySelector('#detail h3')?.textContent`)) === 'Positive Mental Attitude');
  check('cover: missable callout visible', await evalJs(`!!document.querySelector('.missable-callout')`));
  let b = await shot(join(ROOT, 'screenshots/1-cover.jpg'));
  check('cover: <=256 KiB', b <= 262144, b + ' bytes');

  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
  await navigate(BASE + '?demo=1#/route');
  await evalJs(`window.scrollTo(0, document.querySelector('.tabs').offsetTop - 8); 'ok'`);
  check('route: next-up shown', await evalJs(`document.getElementById('nextUp').textContent.includes('Next up')`));
  check('route: 6 stops rendered', (await evalJs(`document.querySelectorAll('.route-group').length`)) === 6);
  b = await shot(join(ROOT, 'screenshots/2-route.jpg'));
  check('route shot: <=256 KiB', b <= 262144, b + ' bytes');

  await navigate(BASE + '?demo=1#/roadmap');
  await evalJs(`window.scrollTo(0, document.querySelector('.tabs').offsetTop - 8); 'ok'`);
  check('roadmap: 5 phases rendered', (await evalJs(`document.querySelectorAll('.phase-card').length`)) === 5);
  b = await shot(join(ROOT, 'screenshots/3-roadmap.jpg'));
  check('roadmap shot: <=256 KiB', b <= 262144, b + ' bytes');

  await navigate(BASE + '?demo=1#/sources');
  await evalJs(`window.scrollTo(0, document.querySelector('.tabs').offsetTop - 8); 'ok'`);
  check('sources: matrix rendered', await evalJs(`document.querySelectorAll('table.matrix tbody tr').length >= 7`));
  b = await shot(join(ROOT, 'screenshots/4-sources.jpg'));
  check('sources shot: <=256 KiB', b <= 262144, b + ' bytes');

  // ---- playtest: tracker behaviour ----
  await navigate(BASE + '?demo=1#/guide');
  check('55 rows rendered', (await evalJs(`document.querySelectorAll('.trophy-list .trophy').length`)) === 55);
  check('result count text', (await evalJs(`document.getElementById('resultCount').textContent`)).startsWith('55 of 55'));
  check('spoiler mask default: hidden name masked',
    await evalJs(`[...document.querySelectorAll('.trophy .t-name')].some(e => e.textContent.includes('Hidden trophy'))`));

  // toggle first checkbox, reload, verify persistence
  await evalJs(`(() => { const box = document.querySelector('.trophy-list .trophy input[type=checkbox]'); box.click(); return document.getElementById('progressBig').textContent; })()`);
  const afterToggle = await evalJs(`document.getElementById('progressBig').textContent`);
  check('toggle earns one more (14/55)', afterToggle === '14 / 55 earned', afterToggle);
  await navigate(BASE + '?demo=1#/guide');
  check('toggle persists after reload', (await evalJs(`document.getElementById('progressBig').textContent`)) === '14 / 55 earned');

  // search: "down to earth" appears only in the Positive Mental Attitude guide
  await evalJs(`(() => { const q = document.getElementById('q'); q.value = 'down to earth'; q.dispatchEvent(new Event('input', {bubbles:true})); return true; })()`);
  await sleep(300);
  check('search "down to earth" finds PMA', (await evalJs(`document.querySelectorAll('.trophy-list .trophy').length`)) === 1);

  // filters: kind + missable
  await evalJs(`(() => { document.getElementById('q').value=''; document.getElementById('q').dispatchEvent(new Event('input',{bubbles:true})); const k=document.getElementById('fKind'); k.value='collectibles'; k.dispatchEvent(new Event('change',{bubbles:true})); return true; })()`);
  await sleep(300);
  check('kind filter collectibles = 7', (await evalJs(`document.querySelectorAll('.trophy-list .trophy').length`)) === 7);
  await evalJs(`(() => { const k=document.getElementById('fKind'); k.value=''; k.dispatchEvent(new Event('change',{bubbles:true})); const m=document.getElementById('fMissable'); m.checked=true; m.dispatchEvent(new Event('change',{bubbles:true})); return true; })()`);
  await sleep(300);
  check('missable-only = 1', (await evalJs(`document.querySelectorAll('.trophy-list .trophy').length`)) === 1);

  // spoiler hide: 27 visible + 3 earned hidden (Just Like Paradise, Paradise Lost, Trust) = 30
  // (the toggled PMA is a visible trophy, not a hidden one)
  await evalJs(`(() => { const m=document.getElementById('fMissable'); m.checked=false; m.dispatchEvent(new Event('change',{bubbles:true})); const s=document.getElementById('fSpoiler'); s.value='hide'; s.dispatchEvent(new Event('change',{bubbles:true})); return true; })()`);
  await sleep(300);
  check('spoiler hide: 30 rows (27 visible + 3 earned hidden)', (await evalJs(`document.querySelectorAll('.trophy-list .trophy').length`)) === 30);
  await evalJs(`(() => { const s=document.getElementById('fSpoiler'); s.value='show'; s.dispatchEvent(new Event('change',{bubbles:true})); return true; })()`);
  await sleep(300);
  check('spoiler show: 55 rows, real hidden names',
    (await evalJs(`document.querySelectorAll('.trophy-list .trophy').length`)) === 55 &&
    await evalJs(`[...document.querySelectorAll('.trophy .t-name')].some(e => e.textContent === 'Just Like Paradise')`));

  // export -> import with a real file object
  const importOk = await evalJs(`(async () => {
    const payload = JSON.stringify({ app: 'Leonida Trophy Compass', version: 4, earned: ['vice-got-a-price','a-long-road'], notes: { 'a-long-road': 'test note' } });
    const file = new File([payload], 'progress.json', { type: 'application/json' });
    const input = document.getElementById('fileImport');
    const dt = new DataTransfer(); dt.items.add(file); input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(r => setTimeout(r, 500));
    return document.getElementById('progressBig').textContent + '|' + (localStorage.getItem('leonida-trophy-compass-v4') || '').includes('test note');
  })()`);
  check('export->import round trip (2 earned + note)', importOk === '2 / 55 earned|true', String(importOk));

  // note field saves
  await evalJs(`(() => { document.querySelector('.trophy[data-id="a-long-road"]').click(); return true; })()`);
  await sleep(300);
  await evalJs(`(() => { const ta = document.getElementById('noteField'); ta.value = '100% checklist first'; ta.dispatchEvent(new Event('input', {bubbles:true})); return true; })()`);
  await sleep(200);
  check('per-trophy note saved', await evalJs(`(JSON.parse(localStorage.getItem('leonida-trophy-compass-v4')).notes || {})['a-long-road'] === '100% checklist first'`));

  // console errors across the whole session
  check('0 console errors / exceptions', consoleErrors.length === 0, consoleErrors.join(' | ').slice(0, 500));
} finally {
  try { ws && ws.close(); } catch { /* ignore */ }
  chrome.kill('SIGKILL');
}

console.log(failures.length === 0 ? '\nALL CHECKS PASSED' : `\n${failures.length} FAILURES: ${failures.join(', ')}`);
process.exit(failures.length === 0 ? 0 : 1);
