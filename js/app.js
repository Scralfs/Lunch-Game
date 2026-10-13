/* Lunchbox app shell: views, navigation and the game runner. */
(function () {
  'use strict';

  const { el } = LB.util;
  const $ = (s) => document.querySelector(s);
  const view = $('#view');
  const gameScreen = $('#game-screen');
  const gameRoot = $('#game-root');
  const gameTitle = $('#game-title');
  const gameStatus = $('#game-status');
  const sheet = $('#sheet');
  const sheetCard = $('#sheet-card');

  let currentTab = 'home';
  let gamesFilter = 'all';
  let deferredInstall = null;

  /* ---------- Helpers ---------- */
  function catOf(g) { return LB.CATEGORIES[g.cat]; }
  function icon(g, cls) {
    const e = el('div', { class: 'gi ' + (cls || ''), text: g.icon });
    e.style.setProperty('--c', catOf(g).colour);
    return e;
  }
  function plays(g) { const s = LB.state.games[g.id]; return s ? s.plays : 0; }
  function bestLabel(g) {
    const s = LB.state.games[g.id];
    if (!s || !s.best) return null;
    const mode = g.modes ? (g.defaultMode || g.modes[0].id) : null;
    let b = LB.getBest(g, mode);
    if (b == null) {
      const vals = Object.values(s.best);
      if (!vals.length) return null;
      b = vals.reduce((a, c) => (g.lowerIsBetter ? Math.min(a, c) : Math.max(a, c)));
    }
    return LB.formatScore(g, b);
  }
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { t.hidden = true; }, 2200);
  }
  function fmtMinutes(sec) {
    const m = Math.round(sec / 60);
    if (m < 60) return m + ' min';
    return Math.floor(m / 60) + 'h ' + (m % 60) + 'm';
  }
  function greeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }

  /* ---------- Theme ---------- */
  function applyTheme() {
    const t = LB.state.settings.theme;
    if (t === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', t);
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
    document.querySelector('meta[name="theme-color"]').setAttribute('content', bg || '#14121f');
  }
  window.matchMedia('(prefers-color-scheme: light)').addEventListener?.('change', applyTheme);

  /* ---------- Tabs ---------- */
  document.querySelectorAll('.tab').forEach((b) => {
    b.addEventListener('click', () => { LB.sfx('tap'); go(b.dataset.tab); });
  });
  function go(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('is-active', b.dataset.tab === tab));
    render();
    window.scrollTo(0, 0);
  }
  function render() {
    view.innerHTML = '';
    view.style.animation = 'none'; void view.offsetWidth; view.style.animation = '';
    ({ home: renderHome, games: renderGames, stats: renderStats, settings: renderSettings })[currentTab]();
  }

  /* ---------- Home ---------- */
  function renderHome() {
    const s = LB.state;
    const name = s.settings.name ? ', ' + s.settings.name : '';
    view.append(el('div', { class: 'top' }, [
      el('div', { class: 'hello' }, [
        el('small', { text: LB.fmtDate(new Date()) }),
        el('h1', { text: greeting() + name }),
      ]),
      el('div', { class: 'brand-badge', text: '🍱' }),
    ]));

    // Streak hero
    const today = s.days[LB.dayKey()] || { plays: 0, time: 0 };
    const now = new Date();
    const monday = LB.addDays(now, -((now.getDay() + 6) % 7));
    const week = el('div', { class: 'week' });
    ['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach((d, i) => {
      const day = LB.addDays(monday, i);
      const k = LB.dayKey(day);
      const c = el('div', { text: d });
      if (s.days[k]) c.classList.add('on');
      if (k === LB.dayKey()) c.classList.add('today');
      week.append(c);
    });
    const st = LB.streak();
    view.append(el('div', { class: 'card hero' }, [
      el('div', { class: 'hero-row' }, [
        el('div', { class: 'hero-stat' }, [el('b', { text: '🔥 ' + st }), el('span', { text: 'day streak' })]),
        el('div', { class: 'hero-stat' }, [el('b', { text: today.plays }), el('span', { text: 'games today' })]),
        el('div', { class: 'hero-stat' }, [el('b', { text: fmtMinutes(today.time) }), el('span', { text: 'brain time today' })]),
      ]),
      week,
    ]));

    // Daily challenge
    const daily = LB.dailyGames();
    const playedToday = (s.days[LB.dayKey()] || {}).games || [];
    const done = daily.filter((g) => playedToday.includes(g.id)).length;
    view.append(el('div', { class: 'section-title' }, [
      el('h2', { text: "Today's lunch menu" }),
      el('span', { text: done + ' / 3 done' }),
    ]));
    const list = el('div', { class: 'daily' });
    daily.forEach((g, i) => {
      const isDone = playedToday.includes(g.id);
      list.append(el('button', { class: 'daily-item', onclick: () => openIntro(g, { daily: true }) }, [
        icon(g),
        el('div', { class: 'meta' }, [
          el('b', { text: ['Starter', 'Main', 'Pudding'][i] + ' · ' + g.name }),
          el('span', { text: catOf(g).name + ' · ' + g.blurb }),
        ]),
        el('div', { class: 'check' + (isDone ? ' done' : ''), text: isDone ? '✓' : '' }),
      ]));
    });
    const prog = el('div', { class: 'progress' }, el('i', { style: 'width:' + (done / 3 * 100) + '%' }));
    view.append(el('div', { class: 'card' }, [list, prog,
      done === 3 ? el('p', { class: 'muted', style: 'margin:10px 0 0;text-align:center', text: 'Full menu cleared – nice work! 🎉' }) : null]));

    // Categories
    view.append(el('div', { class: 'section-title' }, [el('h2', { text: 'Train your…' })]));
    const cats = el('div', { class: 'cats' });
    Object.entries(LB.CATEGORIES).forEach(([id, c]) => {
      const b = el('button', { class: 'cat-card', onclick: () => { gamesFilter = id; go('games'); } }, [el('span', { text: c.icon }), c.name]);
      b.style.setProperty('--c', c.colour);
      cats.append(b);
    });
    view.append(cats);

    // Surprise me
    view.append(el('div', { style: 'margin-top:18px' },
      el('button', { class: 'btn secondary block', onclick: () => openIntro(LB.util.pick(LB.games)) }, '🎲  Surprise me')));
  }

  /* ---------- Games list ---------- */
  function renderGames() {
    view.append(el('div', { class: 'top' }, [
      el('div', { class: 'hello' }, [el('small', { text: LB.games.length + ' games' }), el('h1', { text: 'Games' })]),
    ]));
    const chips = el('div', { class: 'chips' });
    const addChip = (id, label) => chips.append(el('button', {
      class: 'chip' + (gamesFilter === id ? ' is-active' : ''),
      text: label,
      onclick: () => { gamesFilter = id; render(); },
    }));
    addChip('all', 'All');
    Object.entries(LB.CATEGORIES).forEach(([id, c]) => addChip(id, c.icon + ' ' + c.name));
    view.append(chips);

    const grid = el('div', { class: 'grid', style: 'margin-top:10px' });
    LB.games.filter((g) => gamesFilter === 'all' || g.cat === gamesFilter).forEach((g) => {
      const best = bestLabel(g);
      grid.append(el('button', { class: 'tile', onclick: () => openIntro(g) }, [
        plays(g) ? null : el('span', { class: 'new', text: 'NEW' }),
        icon(g),
        el('div', {}, [el('b', { text: g.name }), el('div', { class: 'cat', text: catOf(g).name })]),
        el('div', { class: 'best', html: best ? 'Best <strong>' + best + '</strong>' : g.blurb }),
      ]));
    });
    view.append(grid);
  }

  /* ---------- Stats ---------- */
  function renderStats() {
    const s = LB.state;
    const totalPlays = Object.values(s.games).reduce((a, g) => a + g.plays, 0);
    const totalTime = Object.values(s.games).reduce((a, g) => a + (g.time || 0), 0);
    view.append(el('div', { class: 'top' }, [el('div', { class: 'hello' }, [el('small', { text: 'Your progress' }), el('h1', { text: 'Stats' })])]));

    const kpi = (v, l) => el('div', { class: 'card kpi' }, [el('b', { text: v }), el('span', { text: l })]);
    view.append(el('div', { class: 'kpis' }, [
      kpi(totalPlays, 'games played'),
      kpi(fmtMinutes(totalTime), 'time training'),
      kpi('🔥 ' + LB.streak(), 'current streak'),
      kpi('🏆 ' + LB.bestStreak(), 'best streak'),
    ]));

    // Last 7 days
    view.append(el('div', { class: 'section-title' }, [el('h2', { text: 'Last 7 days' })]));
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = LB.addDays(new Date(), -i);
      days.push({ d, v: (s.days[LB.dayKey(d)] || {}).plays || 0 });
    }
    const max = Math.max(1, ...days.map((x) => x.v));
    const chart = el('div', { style: 'display:flex;gap:8px;align-items:flex-end;height:130px' });
    days.forEach((x) => {
      chart.append(el('div', { style: 'flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;justify-content:flex-end' }, [
        el('span', { style: 'font-size:12px;color:var(--muted)', text: x.v || '' }),
        el('div', { style: 'width:100%;border-radius:8px;background:var(--accent);height:' + Math.max(4, (x.v / max) * 90) + 'px;opacity:' + (x.v ? 1 : .25) }),
        el('span', { style: 'font-size:11px;color:var(--muted)', text: x.d.toLocaleDateString('en-GB', { weekday: 'short' }) }),
      ]));
    });
    view.append(el('div', { class: 'card' }, chart));

    // Category balance
    view.append(el('div', { class: 'section-title' }, [el('h2', { text: 'Brain balance' }), el('span', { text: 'plays by skill' })]));
    const catPlays = {};
    LB.games.forEach((g) => { catPlays[g.cat] = (catPlays[g.cat] || 0) + plays(g); });
    const cmax = Math.max(1, ...Object.values(catPlays));
    const bars = el('div', { class: 'bars' });
    Object.entries(LB.CATEGORIES).forEach(([id, c]) => {
      const v = catPlays[id] || 0;
      const bar = el('div', { class: 'bar' }, el('i', { style: 'width:' + (v / cmax * 100) + '%' }));
      bar.style.setProperty('--c', c.colour);
      bars.append(el('div', { class: 'bar-row' }, [el('span', { text: c.icon + ' ' + c.name }), bar, el('em', { text: v })]));
    });
    view.append(el('div', { class: 'card' }, bars));

    // Per game
    view.append(el('div', { class: 'section-title' }, [el('h2', { text: 'Personal bests' })]));
    const list = el('div', { class: 'list' });
    LB.games.forEach((g) => {
      const st = s.games[g.id];
      let bestText = '–';
      if (st && st.best) {
        if (g.modes) {
          bestText = g.modes.filter((m) => st.best[m.id] != null).map((m) => m.label + ': ' + LB.formatScore(g, st.best[m.id])).join(' · ') || '–';
        } else bestText = LB.formatScore(g, st.best._);
      }
      list.append(el('button', { class: 'list-row', style: 'width:100%;text-align:left', onclick: () => openIntro(g) }, [
        icon(g),
        el('div', { class: 'meta' }, [el('b', { text: g.name }), el('span', { text: (st ? st.plays : 0) + ' plays' })]),
        el('div', { class: 'val', html: '<strong>' + bestText + '</strong>' }),
      ]));
    });
    view.append(el('div', { class: 'card' }, list));
  }

  /* ---------- Settings ---------- */
  function renderSettings() {
    const s = LB.state.settings;
    view.append(el('div', { class: 'top' }, [el('div', { class: 'hello' }, [el('small', { text: 'Make it yours' }), el('h1', { text: 'Settings' })])]));

    const toggle = (key, title, sub) => {
      const input = el('input', { type: 'checkbox' });
      input.checked = !!s[key];
      input.addEventListener('change', () => { s[key] = input.checked; LB.save(); if (key === 'sound' && input.checked) LB.sfx('good'); if (key === 'haptics') LB.buzz(30); });
      return el('div', { class: 'setting' }, [
        el('div', {}, [el('b', { text: title }), el('small', { text: sub })]),
        el('label', { class: 'switch' }, [input, el('i')]),
      ]);
    };

    const nameInput = el('input', { class: 'text-input', style: 'font-size:16px;text-transform:none;letter-spacing:0;text-align:left;padding:10px 12px;max-width:170px', placeholder: 'Your name', maxlength: '20' });
    nameInput.value = s.name || '';
    nameInput.addEventListener('change', () => { s.name = nameInput.value.trim(); LB.save(); toast('Saved'); });

    const seg = el('div', { class: 'seg' });
    [['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']].forEach(([v, l]) => {
      seg.append(el('button', { class: s.theme === v ? 'is-active' : '', text: l, onclick: () => { s.theme = v; LB.save(); applyTheme(); render(); } }));
    });

    view.append(el('div', { class: 'card' }, [
      el('div', { class: 'setting' }, [el('div', {}, [el('b', { text: 'Name' }), el('small', { text: 'For your greeting' })]), nameInput]),
      toggle('sound', 'Sound effects', 'Little beeps and chimes'),
      toggle('haptics', 'Vibration', 'Buzz on mistakes (Android)'),
      el('div', { class: 'setting' }, [el('div', {}, [el('b', { text: 'Theme' })]), seg]),
    ]));

    // Install
    view.append(el('div', { class: 'section-title' }, [el('h2', { text: 'Play offline' })]));
    const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const install = el('div', { class: 'card' });
    if (standalone) {
      install.append(el('p', { style: 'margin:0', text: '✅ Installed. Everything works offline – no signal needed.' }));
    } else {
      install.append(el('p', { style: 'margin:0 0 12px', text: 'Add Lunchbox to your home screen and it works like an app, fully offline.' }));
      if (deferredInstall) {
        install.append(el('button', { class: 'btn block', text: 'Install app', onclick: async () => { deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; render(); } }));
      } else if (isIOS) {
        install.append(el('p', { class: 'muted', style: 'margin:0', html: 'In Safari: tap <b>Share</b> → <b>Add to Home Screen</b>.' }));
      } else {
        install.append(el('p', { class: 'muted', style: 'margin:0', html: 'In Chrome: tap <b>⋮</b> → <b>Add to Home screen</b> / <b>Install app</b>.' }));
      }
    }
    view.append(install);

    // Data
    view.append(el('div', { class: 'section-title' }, [el('h2', { text: 'Your data' })]));
    view.append(el('div', { class: 'card' }, [
      el('p', { class: 'muted', style: 'margin:0 0 12px', text: 'Scores are stored only on this device. Nothing is uploaded anywhere.' }),
      el('button', { class: 'btn danger block', text: 'Reset all scores', onclick: () => {
        if (confirm('Delete all scores, streaks and history? This cannot be undone.')) { LB.resetAll(); toast('All scores reset'); render(); }
      } }),
    ]));
    view.append(el('p', { class: 'muted', style: 'text-align:center;font-size:12px;margin-top:20px', text: 'Lunchbox · ' + LB.games.length + ' games · v' + (window.LB_VERSION || '1') }));
  }

  /* ---------- Sheets ---------- */
  function openSheet(children) {
    sheetCard.innerHTML = '';
    sheetCard.append(...children);
    sheet.hidden = false;
  }
  function closeSheet() { sheet.hidden = true; sheetCard.innerHTML = ''; }
  sheet.addEventListener('click', (e) => {
    if (e.target === sheet && gameScreen.hidden) closeSheet();
  });

  function openIntro(g, opts) {
    opts = opts || {};
    LB.sfx('tap');
    let mode = g.modes ? (LB.state.games[g.id]?.lastMode || g.defaultMode || g.modes[0].id) : null;
    const bestLine = el('p', { class: 'muted', style: 'margin:0 0 16px' });
    const updateBest = () => {
      const b = LB.getBest(g, mode);
      bestLine.textContent = b == null ? 'No score yet – set the bar!' : '🏆 Your best: ' + LB.formatScore(g, b);
    };
    updateBest();

    let modesEl = null;
    if (g.modes) {
      modesEl = el('div', { class: 'modes' });
      g.modes.forEach((m) => {
        modesEl.append(el('button', { class: m.id === mode ? 'is-active' : '', text: m.label, onclick: (e) => {
          mode = m.id; LB.sfx('tap');
          modesEl.querySelectorAll('button').forEach((b) => b.classList.remove('is-active'));
          e.currentTarget.classList.add('is-active');
          updateBest();
        } }));
      });
    }

    openSheet([
      el('div', { class: 'sheet-head' }, [icon(g), el('div', {}, [el('small', { text: catOf(g).icon + ' ' + catOf(g).name }), el('h2', { text: g.name })])]),
      el('div', { class: 'trains' }, g.trains.map((t) => el('span', { text: t }))),
      el('ol', { class: 'howto' }, g.howTo.map((t) => el('li', { text: t }))),
      modesEl,
      bestLine,
      el('div', { class: 'sheet-actions' }, [
        el('button', { class: 'btn block', text: '▶  Play', onclick: () => { closeSheet(); startGame(g, mode, opts); } }),
        el('button', { class: 'btn secondary block', text: 'Not now', onclick: closeSheet }),
      ]),
    ]);
  }

  /* ---------- Game runner ---------- */
  let session = null;

  function teardown() {
    if (!session) return;
    session.alive = false;
    session.timers.forEach((t) => { clearTimeout(t); clearInterval(t); });
    session.cleanups.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });
    session = null;
    gameRoot.innerHTML = '';
    gameStatus.innerHTML = '';
  }

  function startGame(g, mode, opts) {
    teardown();
    if (g.modes && mode) {
      const st = LB.state.games[g.id] || (LB.state.games[g.id] = { plays: 0, best: {}, time: 0, history: [] });
      st.lastMode = mode; LB.save();
    }
    gameScreen.hidden = false;
    document.body.style.overflow = 'hidden';
    if (!history.state || !history.state.game) history.pushState({ game: g.id }, '');
    gameTitle.textContent = g.name + (mode && g.modes ? ' · ' + g.modes.find((m) => m.id === mode).label : '');

    const custom = el('div', { class: 'game-status' });
    const timerPill = el('div', { class: 'pill', hidden: '' });
    gameStatus.append(custom, timerPill);

    const s = session = { g, mode, opts, alive: true, timers: [], cleanups: [], started: Date.now(), finished: false };

    const api = {
      root: gameRoot,
      mode,
      util: LB.util,
      el,
      sfx: LB.sfx,
      buzz: LB.buzz,
      get alive() { return s.alive && session === s && !s.finished; },
      status(items) {
        custom.innerHTML = '';
        [].concat(items || []).forEach((it) => {
          if (it == null) return;
          const o = typeof it === 'object' ? it : { text: it };
          custom.append(el('div', { class: 'pill' + (o.warn ? ' warn' : ''), text: o.text }));
        });
      },
      after(fn, ms) {
        const t = setTimeout(() => { if (api.alive) fn(); }, ms);
        s.timers.push(t); return t;
      },
      every(fn, ms) {
        const t = setInterval(() => { if (api.alive) fn(); }, ms);
        s.timers.push(t); return t;
      },
      onCleanup(fn) { s.cleanups.push(fn); },
      countdown(seconds, onEnd) {
        let end = Date.now() + seconds * 1000;
        let lastWhole = null;
        let stopped = false;
        timerPill.hidden = false;
        const tick = () => {
          if (stopped) return;
          const left = Math.max(0, (end - Date.now()) / 1000);
          const whole = Math.ceil(left);
          timerPill.textContent = '⏱ ' + LB.util.fmtTime(whole);
          timerPill.classList.toggle('warn', left <= 5);
          if (whole !== lastWhole && whole <= 5 && whole > 0 && lastWhole !== null) LB.sfx('tick');
          lastWhole = whole;
          if (left <= 0) { stopped = true; onEnd(); }
        };
        tick();
        api.every(tick, 100);
        return {
          add(sec) { end += sec * 1000; tick(); },
          left() { return Math.max(0, (end - Date.now()) / 1000); },
          stop() { stopped = true; },
        };
      },
      stopwatch() {
        const start = Date.now();
        let stopped = null;
        timerPill.hidden = false;
        const tick = () => { timerPill.textContent = '⏱ ' + LB.util.fmtTime(((stopped || Date.now()) - start) / 1000); };
        tick();
        api.every(tick, 250);
        return {
          elapsed() { return ((stopped || Date.now()) - start) / 1000; },
          stop() { if (!stopped) stopped = Date.now(); tick(); return (stopped - start) / 1000; },
        };
      },
      finish(res) {
        if (!api.alive) return;
        s.finished = true;
        const seconds = Math.round((Date.now() - s.started) / 1000);
        const rec = LB.record(g, mode, res.score, seconds);
        LB.sfx(rec.isBest ? 'win' : 'good');
        setTimeout(() => showResults(g, mode, res, rec, opts), 450);
      },
    };

    try { g.start(api); } catch (e) { console.error(e); toast('Something went wrong starting the game'); }
  }

  function showResults(g, mode, res, rec, opts) {
    if (!session || session.g !== g) return;
    const best = LB.getBest(g, mode);
    let nextDaily = null;
    if (opts.daily) {
      const playedToday = (LB.state.days[LB.dayKey()] || {}).games || [];
      nextDaily = LB.dailyGames().find((x) => !playedToday.includes(x.id));
    }
    const message = res.score == null ? '' : rec.isBest ? 'New personal best!' : rec.firstTime ? 'First score on the board' : '';
    openSheet([
      el('div', { class: 'sheet-head' }, [icon(g), el('div', {}, [el('small', { text: 'Finished' }), el('h2', { text: g.name })])]),
      el('div', { class: 'result-score' }, [el('b', { text: LB.formatScore(g, res.score) }), el('span', { text: g.scoreLabel || '' })]),
      message ? el('span', { class: 'badge-best', text: (rec.isBest ? '🏆 ' : '⭐ ') + message }) : null,
      el('div', { class: 'result-detail', html: (res.detail ? res.detail + '<br>' : '') + (best != null ? 'Best: <b>' + LB.formatScore(g, best) + '</b>' : '') }),
      el('div', { class: 'sheet-actions' }, [
        nextDaily ? el('button', { class: 'btn block', text: 'Next on the menu: ' + nextDaily.name, onclick: () => { closeSheet(); teardown(); openIntro(nextDaily, { daily: true }); } }) : null,
        el('button', { class: 'btn ' + (nextDaily ? 'secondary ' : '') + 'block', text: '↻  Play again', onclick: () => { closeSheet(); startGame(g, mode, opts); } }),
        el('button', { class: 'btn secondary block', text: 'Back to menu', onclick: () => exitGame() }),
      ]),
    ]);
  }

  function closeGameUI() {
    teardown();
    closeSheet();
    gameScreen.hidden = true;
    document.body.style.overflow = '';
    render();
  }
  function exitGame() {
    if (history.state && history.state.game) history.back(); // popstate will close it
    else closeGameUI();
  }
  $('#game-back').addEventListener('click', () => { LB.sfx('tap'); exitGame(); });
  window.addEventListener('popstate', () => { if (!gameScreen.hidden) closeGameUI(); else if (!sheet.hidden) closeSheet(); });

  /* ---------- PWA ---------- */
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstall = e; if (currentTab === 'settings') render(); });
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }

  /* ---------- Carry over the original Lunch Brain best ---------- */
  try {
    const oldSeq = Number(localStorage.getItem('bestSeq')) || 0;
    const seq = LB.game('pattern-recall');
    if (oldSeq && seq && LB.getBest(seq, 'classic') == null) {
      LB.state.games[seq.id] = Object.assign({ plays: 0, best: {}, time: 0, history: [] }, LB.state.games[seq.id]);
      LB.state.games[seq.id].best.classic = oldSeq;
      LB.save();
    }
  } catch (e) { /* storage blocked */ }

  applyTheme();
  render();
})();
