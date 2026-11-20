/* Leonida Trophy Compass v5 — tracker, route planner, roadmap, source matrix.
   Static and offline: the only fetch is the local trophies.json. Progress lives
   in localStorage; export/import move it as a real file. */
(function () {
  'use strict';

  var SAVE_KEY = 'leonida-trophy-compass-v5';

  var data = null;
  var byId = {};
  var state = load();
  var selectedId = null;
  var view = 'guide';

  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) {
    return String(s).replace(/[&<>\"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var fmtMoney = function (n) { return '$' + Number(n).toLocaleString('en-US'); };
  var fmtCount = function (t, v) {
    return t.counter.unit.indexOf('$') === 0 ? fmtMoney(v) : String(v);
  };

  function load() {
    var fresh = { earned: {}, counters: {}, notes: {}, spoiler: 'mask' };
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return fresh;
      var parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        if (parsed.earned) fresh.earned = parsed.earned;
        if (parsed.counters) fresh.counters = parsed.counters;
        if (parsed.notes) fresh.notes = parsed.notes;
        if (parsed.spoiler) fresh.spoiler = parsed.spoiler;
      }
    } catch (e) { /* corrupted save: start fresh */ }
    return fresh;
  }
  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      $('saveState').textContent = 'Progress saved in this browser · ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      $('saveState').textContent = 'Could not save progress in this browser (storage unavailable).';
    }
  }
  function earnedCount() {
    return Object.keys(state.earned).filter(function (id) { return state.earned[id] && byId[id]; }).length;
  }
  function isEarned(t) { return !!state.earned[t.id]; }
  function isFlagged(t) { return t.missable || t.status !== 'confirmed' || !!t.disagree; }
  function methodSources(t) {
    var s = {};
    t.steps.forEach(function (st) { st.src.forEach(function (n) { s[n] = true; }); });
    return Object.keys(s).map(Number);
  }
  function isSingleSource(t) { return methodSources(t).length === 1; }

  /* ---------- audit: every number is computed from the data ---------- */
  function audit() {
    var ts = data.trophies;
    var steps = 0, cited = 0;
    ts.forEach(function (t) {
      t.steps.forEach(function (s) { steps++; if (s.src && s.src.length) cited++; });
    });
    return {
      total: ts.length,
      grades: data.meta.grades,
      hidden: ts.filter(function (t) { return t.hidden; }).length,
      withSource: ts.filter(function (t) { return t.sources && t.sources.length; }).length,
      steps: steps, stepsCited: cited,
      sources: data.meta.sources.length,
      missable: ts.filter(function (t) { return t.missable; }).length,
      watch: ts.filter(isFlagged).length,
      unconfirmed: ts.filter(function (t) { return t.status === 'unconfirmed'; }).length,
      partial: ts.filter(function (t) { return t.status === 'partial'; }).length,
      singleSource: ts.filter(isSingleSource).length,
      disagree: ts.filter(function (t) { return !!t.disagree; }).length,
      hours: ts.reduce(function (s, t) { return s + (t.hours || 0); }, 0)
    };
  }
  function renderAudit() {
    var a = audit();
    var g = a.grades;
    $('auditStrip').innerHTML =
      '<b>AUDIT</b> <span class="sep">·</span> ' +
      a.total + ' official <span class="sep">·</span> ' +
      g.platinum + 'P ' + g.gold + 'G ' + g.silver + 'S ' + g.bronze + 'B <span class="sep">·</span> ' +
      a.hidden + ' hidden <span class="sep">·</span> ' +
      a.withSource + '/' + a.total + ' guides cite a source <span class="sep">·</span> ' +
      a.stepsCited + '/' + a.steps + ' steps cited <span class="sep">·</span> ' +
      a.sources + ' sources read 20 Nov 2026 <span class="sep">·</span> ' +
      '<span class="warn">' + a.missable + ' possibly missable</span> <span class="sep">·</span> ' +
      '<span class="warn">' + a.watch + ' watch</span> <span class="sep">·</span> ' +
      '<span class="warn">' + a.unconfirmed + ' unconfirmed</span> <span class="sep">·</span> ' +
      a.partial + ' partly confirmed <span class="sep">·</span> ' +
      a.singleSource + ' single-source <span class="sep">·</span> ' +
      '<span class="warn">' + a.disagree + ' disagree</span> <span class="sep">·</span> ' +
      '≈' + a.hours + 'h to platinum';
  }

  /* ---------- spoiler handling ---------- */
  function masked(t) {
    return t.hidden && !isEarned(t) && state.spoiler !== 'show';
  }
  function displayName(t) { return masked(t) ? 'Hidden trophy' : t.name; }
  function displayDesc(t) { return masked(t) ? 'Hidden — earn it to reveal the description.' : t.description; }

  /* ---------- list ---------- */
  function routeRank(t) {
    if (t.missable) return -1;
    return t.phase * 100 + data.trophies.indexOf(t);
  }
  function filtered() {
    var q = ($('q').value || '').toLowerCase();
    var kind = $('fKind').value, grade = $('fGrade').value, status = $('fStatus').value;
    var sort = $('fSort').value;
    var missOnly = $('fMissable').checked, flagOnly = $('fFlagged').checked;
    var list = data.trophies.filter(function (t) {
      if (kind !== 'all' && t.kind !== kind) return false;
      if (grade !== 'all' && t.grade !== grade) return false;
      if (status === 'todo' && isEarned(t)) return false;
      if (status === 'earned' && !isEarned(t)) return false;
      if (missOnly && !t.missable) return false;
      if (flagOnly && !isFlagged(t)) return false;
      if (state.spoiler === 'hide' && t.hidden && !isEarned(t)) return false;
      if (q) {
        var hay = (t.name + ' ' + t.description + ' ' + t.area + ' ' + (t.chapter || '') + ' ' +
          t.steps.map(function (s) { return s.text; }).join(' ')).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
    if (sort === 'name') list.sort(function (a, b) { return displayName(a).localeCompare(displayName(b)); });
    else if (sort === 'difficulty') list.sort(function (a, b) { return b.difficulty - a.difficulty || routeRank(a) - routeRank(b); });
    else if (sort === 'hours') list.sort(function (a, b) { return b.hours - a.hours || routeRank(a) - routeRank(b); });
    else list.sort(function (a, b) { return routeRank(a) - routeRank(b); });
    return list;
  }
  function gradeLabel(g) { return g.charAt(0).toUpperCase() + g.slice(1); }
  function kindLabel(k) {
    return { story: 'Story', quests: 'Quest', robberies: 'Robbery', collectibles: 'Collectible', activities: 'Activity', misc: 'Misc', platinum: 'Platinum' }[k] || k;
  }
  function badgesHtml(t, detail) {
    var out = '';
    if (t.missable) out += '<span class="badge missable">MISSABLE</span>';
    if (t.status === 'unconfirmed') out += '<span class="badge unconfirmed">METHOD UNCONFIRMED</span>';
    if (t.status === 'partial') out += '<span class="badge partial">PARTLY CONFIRMED</span>';
    if (t.disagree) out += '<span class="badge disagree">SOURCES DISAGREE</span>';
    if (t.hidden && !detail) out += '<span class="badge hidden-dot">HIDDEN</span>';
    return out;
  }
  function renderList() {
    var list = filtered();
    var ul = $('trophyList');
    ul.innerHTML = '';
    list.forEach(function (t) {
      var li = document.createElement('li');
      if (t.id === selectedId) li.className = 'selected';
      if (isEarned(t)) li.className += (li.className ? ' ' : '') + 'earned';
      var box = document.createElement('input');
      box.type = 'checkbox';
      box.checked = isEarned(t);
      box.setAttribute('aria-label', 'Mark ' + displayName(t) + ' earned');
      box.addEventListener('change', function (ev) {
        ev.stopPropagation();
        state.earned[t.id] = box.checked;
        if (!box.checked) delete state.earned[t.id];
        save(); renderAll();
      });
      var main = document.createElement('div');
      main.className = 'tmain';
      var name = document.createElement('div');
      name.className = 'tname';
      name.innerHTML = esc(displayName(t)) + badgesHtml(t, false);
      var meta = document.createElement('div');
      meta.className = 'tmeta';
      meta.textContent = gradeLabel(t.grade) + ' · ' + kindLabel(t.kind) +
        (t.chapter ? ' · ' + t.chapter : '') +
        (t.counter ? ' · ' + (state.counters[t.id] || 0) + '/' + t.counter.target + ' ' + t.counter.unit : '') +
        (t.hours ? ' · ~' + t.hours + 'h' : '');
      main.appendChild(name);
      main.appendChild(meta);
      var dot = document.createElement('span');
      dot.className = 'grade-dot ' + t.grade;
      li.appendChild(box);
      li.appendChild(dot);
      li.appendChild(main);
      li.addEventListener('click', function (ev) {
        if (ev.target === box) return;
        selectedId = t.id;
        renderAll();
      });
      ul.appendChild(li);
    });
    $('resultCount').textContent = list.length + ' of ' + data.trophies.length + ' trophies shown · ' +
      earnedCount() + ' earned · ' + data.trophies.filter(function (t) { return !isEarned(t); }).length + ' to go';
  }

  /* ---------- detail ---------- */
  function citeHtml(srcList) {
    return srcList.map(function (n) {
      var s = data.meta.sources[n - 1];
      return '<span class="cite" title="' + esc(s.name) + '">[' + n + ']</span>';
    }).join('');
  }
  function renderDetail() {
    var t = byId[selectedId] || data.trophies[0];
    var el = $('detail');
    var counterHtml = '';
    if (t.counter) {
      var v = state.counters[t.id] || 0;
      var step = t.counter.step || 1;
      var pct = Math.min(100, Math.round(v / t.counter.target * 100));
      counterHtml =
        '<h3>Counter</h3>' +
        '<div class="counter-box">' +
          '<button type="button" data-counter="-1" aria-label="Decrease counter">−</button>' +
          '<span class="count">' + fmtCount(t, v) + ' <small>/ ' + fmtCount(t, t.counter.target) + ' ' + esc(t.counter.unit) + '</small></span>' +
          '<button type="button" data-counter="1" aria-label="Increase counter">+</button>' +
          (v >= t.counter.target ? '<span class="done">Target reached — mark it earned.</span>' : '') +
          '<div class="counter-bar"><span style="width:' + pct + '%"></span></div>' +
        '</div>';
    }
    var disagreeHtml = '';
    if (t.disagree) {
      disagreeHtml = '<div class="callout info"><h4>Sources disagree — both versions shown</h4>' +
        '<p><b>' + esc(t.disagree.topic) + '</b></p>' +
        t.disagree.versions.map(function (ver) {
          return '<p class="ver"><b>' + esc(ver.from) + ':</b> ' + esc(ver.text) + '</p>';
        }).join('') +
        '<p>' + esc(t.disagree.ruling) + '</p></div>';
    }
    var openHtml = '';
    if (t.open) {
      openHtml = '<div class="callout ' + (t.status === 'unconfirmed' ? 'bad' : 'warn') + '"><h4>' +
        (t.status === 'unconfirmed' ? 'Method unconfirmed' : 'Open question') +
        '</h4><p>' + esc(t.open) + '</p></div>';
    }
    el.innerHTML =
      '<div class="detail-head"><h2>' + esc(displayName(t)) + '</h2>' +
      '<span class="grade-tag ' + t.grade + '">' + gradeLabel(t.grade) + '</span></div>' +
      '<p class="detail-desc">“' + esc(displayDesc(t)) + '”</p>' +
      '<p class="detail-meta">' + kindLabel(t.kind) +
      (t.chapter ? ' · ' + esc(t.chapter) : '') + ' · ' + esc(t.area) +
      ' · Difficulty ' + t.difficulty + '/5' + (t.hours ? ' · ~' + t.hours + 'h' : '') + '</p>' +
      '<div class="detail-badges">' + badgesHtml(t, true) + '</div>' +
      '<div class="detail-actions">' +
        '<button type="button" id="toggleEarned" class="btn-earned' + (isEarned(t) ? ' earned' : '') + '">' +
        (isEarned(t) ? '✓ Earned — click to unmark' : 'Mark earned') + '</button>' +
        '<span class="detail-meta" style="margin:0">Route position ' + (data.trophies.indexOf(t) + 1) + ' of 55 · ' +
        'phase ' + t.phase + ' of 5</span>' +
      '</div>' +
      openHtml + disagreeHtml +
      '<h3>How to unlock — ' + t.steps.length + ' steps, all cited</h3>' +
      '<ol class="steps">' + t.steps.map(function (s) {
        return '<li>' + esc(s.text) + ' ' + citeHtml(s.src) + '</li>';
      }).join('') + '</ol>' +
      counterHtml +
      '<h3>Your note</h3>' +
      '<textarea class="note-area" id="noteArea" placeholder="Where you are up to, what to try next…">' +
      esc(state.notes[t.id] || '') + '</textarea>' +
      '<h3>Sources for this trophy</h3>' +
      '<p class="detail-sources">' + t.sources.map(function (n) {
        var s = data.meta.sources[n - 1];
        return '[' + n + '] <a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name) + '</a>';
      }).join(' · ') + '</p>';
    $('toggleEarned').addEventListener('click', function () {
      if (isEarned(t)) delete state.earned[t.id]; else state.earned[t.id] = true;
      save(); renderAll();
    });
    el.querySelectorAll('[data-counter]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var dir = Number(btn.getAttribute('data-counter'));
        var cur = state.counters[t.id] || 0;
        var next = Math.max(0, cur + dir * (t.counter.step || 1));
        if (next === 0) delete state.counters[t.id]; else state.counters[t.id] = next;
        save(); renderAll();
      });
    });
    $('noteArea').addEventListener('input', function () {
      var v = $('noteArea').value;
      if (v) state.notes[t.id] = v; else delete state.notes[t.id];
      save();
    });
  }

  /* ---------- sources panel (column 3) ---------- */
  function renderSourcesPanel() {
    var a = audit();
    var rows = data.meta.sources.map(function (s) {
      var n = data.trophies.filter(function (t) { return t.sources.indexOf(s.n) !== -1; }).length;
      return '<li id="src-' + s.n + '"><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name) + '</a> ' +
        '<span class="src-count">cited by ' + n + ' of 55 guides</span>' +
        '<span class="src-meta">' + esc(s.read) + ' — ' + esc(s.covers) + '</span></li>';
    }).join('');
    var flagged = data.trophies.filter(isFlagged);
    $('sourcesPanel').innerHTML =
      '<div class="src-card"><h3>Sources — numbered, as cited [n]</h3><ol>' + rows + '</ol></div>' +
      '<div class="src-card"><h3>What to watch — ' + flagged.length + ' trophies</h3>' +
      '<ul class="mini-list">' +
      flagged.map(function (t) {
        var why = t.missable ? 'possibly missable' : t.status === 'unconfirmed' ? 'method unconfirmed' : t.status === 'partial' ? 'partly confirmed' : 'sources disagree';
        return '<li><b>' + esc(t.name) + '</b> — ' + why + '</li>';
      }).join('') + '</ul></div>' +
      '<div class="src-card"><h3>How this guide was checked</h3>' +
      '<p class="mini">Names, descriptions, grades and hidden flags were cross-checked trophy by trophy between Insider Gaming and GTABase, both read in full on 20 Nov 2026: <b>55 of 55 agree</b>. Every step cites its source; ' + a.stepsCited + ' of ' + a.steps + ' steps carry a citation. Where sources disagree, both versions are shown in the trophy detail — never hidden. One method is still unconfirmed and is labelled as such.</p></div>';
  }

  /* ---------- next up / route / roadmap ---------- */
  function nextUp() {
    return data.trophies.find(function (t) { return !isEarned(t); }) || null;
  }
  function renderNextUp() {
    var n = nextUp();
    var html;
    if (!n) {
      html = '<div class="kicker">Next up</div><div class="name">All 55 earned — Leonida Legend.</div>' +
        '<div class="why">Vice Got a Price! should have popped. Export your progress as a keepsake.</div>';
    } else {
      var why = n.missable ? 'The one possibly missable step — do it in Chapter 1, before anything else.'
        : 'Route position ' + (data.trophies.indexOf(n) + 1) + ' of 55 · phase ' + n.phase + ' · ' + kindLabel(n.kind) + ' · ' + esc(n.area);
      html = '<div class="kicker">Next up — missable first</div>' +
        '<div class="name">' + esc(displayName(n)) + badgesHtml(n, false) + '</div>' +
        '<div class="why">' + esc(displayDesc(n)) + '<br>' + why + '</div>' +
        '<button type="button" id="btnNextUp">Open this trophy</button>';
    }
    $('nextUp').innerHTML = html;
    $('nextUpRoute').innerHTML = n
      ? '<b>Next up:</b> ' + esc(displayName(n)) + ' — ' + esc(displayDesc(n)) + ' <span style="color:#5c4d1a">(' + (n.missable ? 'possibly missable — Chapter 1' : 'phase ' + n.phase + ', ' + esc(n.area)) + ')</span>'
      : '<b>All 55 earned.</b>';
    var btn = $('btnNextUp');
    if (btn) btn.addEventListener('click', function () { selectedId = n.id; setView('guide'); renderAll(); });
  }
  var ROUTE_GROUPS = [
    { key: 'missable', title: 'Stop 0 — Do this first: the one missable step', blurb: 'Before anything else. One meditation in Chapter 1 may not come back.', match: function (t) { return t.missable; } },
    { key: 'p1', title: 'Phase 1 — Chapters 1–2: the story opens', blurb: 'Meet Cal, Kenton and Moses, unlock both characters, and finish Chapter 2.', match: function (t) { return t.phase === 1 && !t.missable; } },
    { key: 'p2', title: 'Phase 2 — Chapters 3–4: the story deepens', blurb: 'Andy, Randy and Tyrone open up; vaults and jewelry jobs unlock.', match: function (t) { return t.phase === 2; } },
    { key: 'p3', title: 'Phase 3 — Finale and free roam', blurb: 'Finish Chapter 5, then the whole map stays open. Partner trophies and the airport stunt live here.', match: function (t) { return t.phase === 3; } },
    { key: 'p4', title: 'Phase 4 — The clean-up sweep', blurb: 'Collectibles, challenges, stranger strands and the long grinds, grouped so one trip covers several trophies.', match: function (t) { return t.phase === 4; } },
    { key: 'p5', title: 'Phase 5 — The platinum', blurb: 'The 100% checklist, then the platinum itself. Nothing here is missable.', match: function (t) { return t.phase === 5; } }
  ];
  function renderRoute() {
    $('routeGroups').innerHTML = ROUTE_GROUPS.map(function (g) {
      var items = data.trophies.filter(g.match);
      var left = items.filter(function (t) { return !isEarned(t); });
      var hours = items.reduce(function (s, t) { return s + (t.hours || 0); }, 0);
      return '<div class="group"><h3>' + esc(g.title) + '</h3>' +
        '<p class="blurb">' + esc(g.blurb) + '</p>' +
        '<p class="group-stats">' + (items.length - left.length) + ' / ' + items.length + ' earned · ~' + hours + 'h · ' + left.length + ' left</p>' +
        '<ul>' + items.map(function (t) {
          return '<li data-id="' + t.id + '" class="' + (isEarned(t) ? 'earned' : '') + '">' +
            '<span class="grade-dot ' + t.grade + '"></span>' +
            '<span class="tname">' + esc(displayName(t)) + '</span>' + badgesHtml(t, false) +
            '<span class="tnote">' + esc(t.area) + (t.hours ? ' · ~' + t.hours + 'h' : '') + '</span></li>';
        }).join('') + '</ul></div>';
    }).join('');
    $('routeGroups').querySelectorAll('li[data-id]').forEach(function (li) {
      li.addEventListener('click', function () { selectedId = li.getAttribute('data-id'); setView('guide'); renderAll(); });
    });
  }
  var PHASES = [
    { n: 1, title: 'Phase 1 — Play the story, Chapters 1–2', hours: '60–80h with the story' },
    { n: 2, title: 'Phase 2 — Chapters 3–4 and the quest lines', hours: 'Story + quest lines' },
    { n: 3, title: 'Phase 3 — Finale, then free roam', hours: 'Finish Chapter 5, then everything stays open' },
    { n: 4, title: 'Phase 4 — 100% checklist and clean-up', hours: 'Around 100h — the long grind' },
    { n: 5, title: 'Phase 5 — The platinum', hours: 'A Long Road, then Vice Got a Price!' }
  ];
  function renderRoadmap() {
    $('roadmapPhases').innerHTML = PHASES.map(function (p) {
      var items = data.trophies.filter(function (t) { return t.phase === p.n; });
      var done = items.filter(isEarned).length;
      var hours = items.reduce(function (s, t) { return s + (t.hours || 0); }, 0);
      return '<div class="phase-card"><h3>' + esc(p.title) + '</h3>' +
        '<p class="blurb">' + esc(p.hours) + '</p>' +
        '<p class="phase-stats">' + done + ' / ' + items.length + ' earned · ~' + hours + 'h in this phase</p>' +
        '<ul>' + items.map(function (t) {
          return '<li data-id="' + t.id + '" class="' + (isEarned(t) ? 'earned' : '') + '">' +
            '<span class="grade-dot ' + t.grade + '"></span>' +
            '<span class="tname">' + esc(displayName(t)) + '</span>' + badgesHtml(t, false) +
            '<span class="tnote">' + esc(displayDesc(t)) + '</span></li>';
        }).join('') + '</ul></div>';
    }).join('') +
    '<div class="group"><h3>Rules that protect the run</h3>' +
    '<ul><li>Do the Chapter 1 balcony meditation — it may not come back.</li>' +
    '<li>Keep a manual save at the start and end of each chapter (15 slots; no mission replay).</li>' +
    '<li>Cheats disable trophies and saving — keep them off a trophy run.</li>' +
    '<li>Turn on progress and collectible notifications in Settings so nothing is missed silently.</li>' +
    '<li>Everything except that one meditation can be done after the story in free roam.</li></ul></div>';
    $('roadmapPhases').querySelectorAll('li[data-id]').forEach(function (li) {
      li.addEventListener('click', function () { selectedId = li.getAttribute('data-id'); setView('guide'); renderAll(); });
    });
  }
  function renderSourcesView() {
    var matrix = '<h3 class="section-title">Source matrix — what each source confirms</h3>' +
      '<table class="matrix"><thead><tr><th>#</th><th>Source</th><th>Read</th><th>What it covers</th><th>Cited by</th></tr></thead><tbody>' +
      data.meta.sources.map(function (s) {
        var n = data.trophies.filter(function (t) { return t.sources.indexOf(s.n) !== -1; }).length;
        return '<tr><td>' + s.n + '</td><td><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name) + '</a></td>' +
          '<td>' + esc(s.read) + '</td><td>' + esc(s.covers) + '</td><td><b>' + n + ' of 55 guides</b></td></tr>';
      }).join('') + '</tbody></table>' +
      '<p class="fineprint">' + esc(data.meta.verified) + '</p>';
    var disagreements = data.trophies.filter(function (t) { return !!t.disagree; });
    var dHtml = '<h3 class="section-title">Where the sources disagree — ' + disagreements.length + ' trophies</h3>' +
      disagreements.map(function (t) {
        return '<div class="disagree-card"><h4>' + esc(t.name) + ' — ' + esc(t.disagree.topic) + '</h4>' +
          t.disagree.versions.map(function (ver) {
            return '<p><b>' + esc(ver.from) + ':</b> ' + esc(ver.text) + '</p>';
          }).join('') + '<p>' + esc(t.disagree.ruling) + '</p></div>';
      }).join('');
    var labels = '<h3 class="section-title">Honesty labels</h3>' +
      '<div class="disagree-card"><h4>Method unconfirmed — 1 trophy</h4><p><b>Bad Luck, I Guess</b> — no source has confirmed the method. PowerPyx offers one unverified guess (the Payday Loans store in Little Cuba); it is shown as a guess, not a method.</p></div>' +
      '<div class="disagree-card"><h4>Partly confirmed — 1 trophy</h4><p><b>Fair Game</b> — the hunting line is confirmed, but which animal triggers the trophy is not confirmed yet (GTABase and PowerPyx agree). Complete all 15 Target Decks; the trophy should follow.</p></div>' +
      '<div class="disagree-card"><h4>Open question — 1 trophy</h4><p><b>Positive Mental Attitude</b> — whether the Chapter 1 balcony meditation counts toward the 18 is unclear (GTABase and PowerPyx). Do it anyway.</p></div>';
    $('sourceMatrix').innerHTML = matrix + dHtml + labels;
  }

  /* ---------- chrome ---------- */
  function renderHeader() {
    var n = earnedCount();
    $('earnedLine').textContent = n + ' / 55 earned';
    $('miniBarFill').style.width = Math.round(n / 55 * 100) + '%';
  }
  function setView(v) {
    view = v;
    document.querySelectorAll('.tabs button').forEach(function (b) {
      var active = b.getAttribute('data-view') === v;
      b.classList.toggle('active', active);
      if (active) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    document.querySelectorAll('.view').forEach(function (s) {
      s.classList.toggle('active', s.id === 'view-' + v);
    });
  }
  function renderAll() {
    renderHeader();
    renderAudit();
    renderList();
    renderDetail();
    renderSourcesPanel();
    renderNextUp();
    renderRoute();
    renderRoadmap();
    renderSourcesView();
  }

  function exportProgress() {
    var blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'leonida-trophy-compass-progress.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function importProgress(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = JSON.parse(reader.result);
        if (!parsed || typeof parsed !== 'object' || !parsed.earned) throw new Error('bad file');
        state = {
          earned: parsed.earned || {},
          counters: parsed.counters || {},
          notes: parsed.notes || {},
          spoiler: parsed.spoiler || 'mask'
        };
        $('fSpoiler').value = state.spoiler;
        save(); renderAll();
        $('saveState').textContent = 'Progress imported from ' + file.name + '.';
      } catch (e) {
        $('saveState').textContent = 'Import failed: that file is not a Leonida Trophy Compass progress file.';
      }
    };
    reader.readAsText(file);
  }

  fetch('data/trophies.json')
    .then(function (r) { if (!r.ok) throw new Error('trophies.json ' + r.status); return r.json(); })
    .then(function (doc) {
      data = doc;
      data.trophies.forEach(function (t) { byId[t.id] = t; });
      selectedId = data.trophies[0].id;
      $('fSpoiler').value = state.spoiler;
      ['q', 'fKind', 'fGrade', 'fStatus', 'fSort', 'fMissable', 'fFlagged'].forEach(function (id) {
        $(id).addEventListener('input', renderList);
        $(id).addEventListener('change', renderList);
      });
      $('fSpoiler').addEventListener('change', function () {
        state.spoiler = $('fSpoiler').value;
        save(); renderAll();
      });
      document.querySelectorAll('.tabs button').forEach(function (b) {
        b.addEventListener('click', function () { setView(b.getAttribute('data-view')); });
      });
      $('btnExport').addEventListener('click', exportProgress);
      $('fileImport').addEventListener('change', function (e) {
        if (e.target.files[0]) importProgress(e.target.files[0]);
        e.target.value = '';
      });
      $('btnPrint').addEventListener('click', function () { window.print(); });
      $('btnReset').addEventListener('click', function () {
        if (!window.confirm('Reset all progress, counters and notes?')) return;
        state = { earned: {}, counters: {}, notes: {}, spoiler: state.spoiler };
        save(); renderAll();
      });
      renderAll();
      save();
    })
    .catch(function (err) {
      $('auditStrip').textContent = 'Could not load trophies.json: ' + err.message;
    });
})();
