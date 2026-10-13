/* Lunchbox core: storage, sound, utilities and the game registry. */
(function () {
  'use strict';

  const STORE_KEY = 'lunchbox.v1';

  const CATEGORIES = {
    memory: { name: 'Memory', icon: '🧠', colour: 'var(--memory)' },
    maths:  { name: 'Maths',  icon: '➗', colour: 'var(--maths)' },
    focus:  { name: 'Focus',  icon: '🎯', colour: 'var(--focus)' },
    words:  { name: 'Words',  icon: '🔤', colour: 'var(--words)' },
    logic:  { name: 'Logic',  icon: '🧩', colour: 'var(--logic)' },
    speed:  { name: 'Speed',  icon: '⚡', colour: 'var(--speed)' },
  };

  /* ---------- Storage ---------- */
  const defaults = () => ({
    settings: { sound: true, haptics: true, theme: 'auto', name: '' },
    games: {},
    days: {},
  });

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return defaults();
      const data = JSON.parse(raw);
      const d = defaults();
      return {
        settings: Object.assign(d.settings, data.settings),
        games: data.games || {},
        days: data.days || {},
      };
    } catch (e) {
      return defaults();
    }
  }

  const state = load();

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* storage full or blocked */ }
  }

  function resetAll() {
    const fresh = defaults();
    fresh.settings = state.settings;
    state.games = fresh.games;
    state.days = fresh.days;
    save();
  }

  /* ---------- Dates (local time, UK display) ---------- */
  function dayKey(d) {
    d = d || new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }
  function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function fmtDate(d) {
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  function streak() {
    let n = 0;
    let d = new Date();
    // Today not played yet doesn't break the streak.
    if (!state.days[dayKey(d)]) d = addDays(d, -1);
    while (state.days[dayKey(d)]) { n++; d = addDays(d, -1); }
    return n;
  }

  function bestStreak() {
    const keys = Object.keys(state.days).sort();
    let best = 0, run = 0, prev = null;
    for (const k of keys) {
      const cur = new Date(k + 'T12:00:00');
      if (prev && Math.round((cur - prev) / 864e5) === 1) run++; else run = 1;
      best = Math.max(best, run);
      prev = cur;
    }
    return best;
  }

  /* ---------- Random ---------- */
  function seeded(seed) {
    // mulberry32
    let a = seed >>> 0;
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  const util = {
    rand: (n) => Math.floor(Math.random() * n),
    between: (a, b) => a + Math.floor(Math.random() * (b - a + 1)),
    pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
    shuffle(arr, rng) {
      rng = rng || Math.random;
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    el(tag, attrs, children) {
      const e = document.createElement(tag);
      if (attrs) for (const k in attrs) {
        if (k === 'class') e.className = attrs[k];
        else if (k === 'text') e.textContent = attrs[k];
        else if (k === 'html') e.innerHTML = attrs[k];
        else if (k === 'style') e.style.cssText = attrs[k];
        else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]);
        else e.setAttribute(k, attrs[k]);
      }
      if (children) for (const c of [].concat(children)) if (c != null) e.append(c);
      return e;
    },
    flash(node, good) {
      const cls = good ? 'flash-good' : 'flash-bad';
      node.classList.remove('flash-good', 'flash-bad');
      void node.offsetWidth;
      node.classList.add(cls);
    },
    fmtTime(sec) {
      sec = Math.max(0, Math.round(sec));
      return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
    },
    seeded, hash,
  };

  /* ---------- Sound & haptics ---------- */
  let ctx = null;
  function audio() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, dur, type, vol, delay) {
    const a = audio(); if (!a) return;
    const t = a.currentTime + (delay || 0);
    const o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.15, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(a.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }
  const SOUNDS = {
    tap:  () => tone(520, 0.06, 'triangle', 0.08),
    good: () => { tone(660, 0.09, 'sine', 0.14); tone(990, 0.12, 'sine', 0.12, 0.07); },
    bad:  () => tone(160, 0.2, 'square', 0.07),
    win:  () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'triangle', 0.13, i * 0.1)),
    tick: () => tone(1200, 0.03, 'square', 0.04),
    go:   () => tone(880, 0.15, 'sine', 0.16),
  };
  function sfx(name) {
    if (!state.settings.sound) return;
    try { (SOUNDS[name] || SOUNDS.tap)(); } catch (e) { /* ignore */ }
  }
  function buzz(pattern) {
    if (!state.settings.haptics || !navigator.vibrate) return;
    try { navigator.vibrate(pattern); } catch (e) { /* ignore */ }
  }

  /* ---------- Games registry ---------- */
  const games = [];
  function register(def) { games.push(def); }
  function game(id) { return games.find((g) => g.id === id); }

  function bestKey(mode) { return mode || '_'; }
  function isBetter(def, a, b) {
    if (b == null) return true;
    return def.lowerIsBetter ? a < b : a > b;
  }
  function getBest(def, mode) {
    const g = state.games[def.id];
    return g && g.best ? g.best[bestKey(mode)] : undefined;
  }
  function formatScore(def, score) {
    if (score == null) return '–';
    if (def.formatScore) return def.formatScore(score);
    return String(score);
  }

  function record(def, mode, score, seconds) {
    const g = state.games[def.id] || (state.games[def.id] = { plays: 0, best: {}, time: 0, history: [] });
    const prev = g.best[bestKey(mode)];
    const isBest = score != null && isBetter(def, score, prev);
    g.plays++;
    g.time += seconds;
    g.last = Date.now();
    if (isBest) g.best[bestKey(mode)] = score;
    g.history = (g.history || []).concat([{ t: Date.now(), s: score, m: mode || null }]).slice(-30);

    const k = dayKey();
    const d = state.days[k] || (state.days[k] = { plays: 0, time: 0, games: [] });
    d.plays++;
    d.time += seconds;
    if (!d.games.includes(def.id)) d.games.push(def.id);
    save();
    return { isBest: isBest && prev != null, firstTime: prev == null, prev };
  }

  /* ---------- Daily challenge ---------- */
  function dailyGames(date) {
    const rng = seeded(hash('daily-' + dayKey(date)));
    const order = util.shuffle(games, rng);
    const picked = [];
    const usedCats = new Set();
    for (const g of order) {
      if (usedCats.has(g.cat)) continue;
      picked.push(g); usedCats.add(g.cat);
      if (picked.length === 3) break;
    }
    return picked;
  }

  window.LB = {
    CATEGORIES, state, save, resetAll, util, sfx, buzz,
    register, games, game, getBest, formatScore, record,
    dayKey, addDays, fmtDate, streak, bestStreak, dailyGames,
  };
})();
