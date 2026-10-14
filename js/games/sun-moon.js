(function () {
  'use strict';

  /* ---------- Puzzle generator ---------- */
  // 6×6 grid of suns (0) and moons (1). Each row and column has three of each, no more
  // than two the same next to each other, and "=" / "×" signs between neighbours mean
  // same / opposite. Clues are chosen so there is exactly one solution.
  const N = 6, HALF = 3;

  const EDGES = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const i = r * N + c;
    if (c < N - 1) EDGES.push([i, i + 1]);
    if (r < N - 1) EDGES.push([i, i + N]);
  }

  // Is the partly filled grid still consistent?
  function ok(g, i, edgeMap) {
    const r = Math.floor(i / N), c = i % N, v = g[i];
    let rowCount = 0, colCount = 0;
    for (let k = 0; k < N; k++) {
      if (g[r * N + k] === v) rowCount++;
      if (g[k * N + c] === v) colCount++;
    }
    if (rowCount > HALF || colCount > HALF) return false;
    const same = (a, b) => a >= 0 && b >= 0 && a < N * N && b < N * N && g[a] === v && g[b] === v;
    if (c >= 2 && same(i - 1, i - 2)) return false;
    if (c >= 1 && c <= N - 2 && same(i - 1, i + 1)) return false;
    if (c <= N - 3 && same(i + 1, i + 2)) return false;
    if (r >= 2 && same(i - N, i - 2 * N)) return false;
    if (r >= 1 && r <= N - 2 && same(i - N, i + N)) return false;
    if (r <= N - 3 && same(i + N, i + 2 * N)) return false;
    if (edgeMap) {
      for (const [j, type] of edgeMap[i] || []) {
        if (g[j] == null) continue;
        if (type === '=' ? g[j] !== v : g[j] === v) return false;
      }
    }
    return true;
  }

  function buildEdgeMap(edges) {
    const m = {};
    for (const e of edges) {
      (m[e.a] = m[e.a] || []).push([e.b, e.type]);
      (m[e.b] = m[e.b] || []).push([e.a, e.type]);
    }
    return m;
  }

  function solve(givens, edges, limit) {
    const g = givens.slice();
    const edgeMap = buildEdgeMap(edges);
    for (let i = 0; i < N * N; i++) if (g[i] != null && !ok(g, i, edgeMap)) return [];
    const sols = [];
    const go = (i) => {
      if (sols.length >= limit) return;
      if (i === N * N) { sols.push(g.slice()); return; }
      if (g[i] != null) { go(i + 1); return; }
      for (const v of [0, 1]) {
        g[i] = v;
        if (ok(g, i, edgeMap)) go(i + 1);
        g[i] = null;
      }
    };
    go(0);
    return sols;
  }

  function randomSolution(rng) {
    const g = Array(N * N).fill(null);
    const go = (i) => {
      if (i === N * N) return true;
      for (const v of rng() < 0.5 ? [0, 1] : [1, 0]) {
        g[i] = v;
        if (ok(g, i) && go(i + 1)) return true;
      }
      g[i] = null;
      return false;
    };
    go(0);
    return g;
  }

  // minClues keeps extra clues in for easier puzzles (0 = strip to the bare minimum).
  function generate(minClues, rng) {
    rng = rng || Math.random;
    const pick = (arr) => arr[Math.floor(rng() * arr.length)];
    const sol = randomSolution(rng);
    const givens = Array(N * N).fill(null);
    const edges = [];
    const edgeFor = ([a, b]) => ({ a, b, type: sol[a] === sol[b] ? '=' : '×' });

    // Add clues until the solution is unique, aiming each new clue at a cell the
    // rival solution gets wrong.
    for (let guard = 0; guard < 200; guard++) {
      const sols = solve(givens, edges, 2);
      if (sols.length === 1) break;
      const alt = sols.find((s) => s.some((v, i) => v !== sol[i]));
      const wrong = [];
      alt.forEach((v, i) => { if (v !== sol[i]) wrong.push(i); });
      const i = pick(wrong);
      if (rng() < 0.45) givens[i] = sol[i];
      else {
        const options = EDGES.filter(([a, b]) => (a === i || b === i) && !edges.some((e) => e.a === a && e.b === b));
        if (options.length) edges.push(edgeFor(pick(options))); else givens[i] = sol[i];
      }
    }

    // Easier puzzles: top up with extra (correct) clues before trimming.
    while (minClues && givens.filter((v) => v != null).length + edges.length < minClues) {
      if (rng() < 0.5) { const i = Math.floor(rng() * N * N); givens[i] = sol[i]; }
      else {
        const options = EDGES.filter(([a, b]) => !edges.some((e) => e.a === a && e.b === b));
        edges.push(edgeFor(pick(options)));
      }
    }

    // Then strip out clues that are not needed.
    const clues = [];
    givens.forEach((v, i) => { if (v != null) clues.push({ kind: 'cell', i }); });
    edges.forEach((e) => clues.push({ kind: 'edge', e }));
    let count = clues.length;
    for (const cl of clues.sort(() => rng() - 0.5)) {
      if (count <= (minClues || 0)) break;
      if (cl.kind === 'cell') {
        const keep = givens[cl.i];
        givens[cl.i] = null;
        if (solve(givens, edges, 2).length !== 1) givens[cl.i] = keep; else count--;
      } else {
        const idx = edges.indexOf(cl.e);
        edges.splice(idx, 1);
        if (solve(givens, edges, 2).length !== 1) edges.splice(idx, 0, cl.e); else count--;
      }
    }
    return { givens, edges, solution: sol };
  }

  /* ---------- Game ---------- */
  LB.register({
    id: 'sun-moon',
    name: 'Sun & Moon',
    cat: 'logic',
    icon: '🌗',
    blurb: 'Balance suns and moons on the grid',
    trains: ['Logical deduction', 'Rule juggling'],
    howTo: [
      'Fill every square with a ☀️ or a 🌙.',
      'Each row and column has three of each.',
      'No more than two of the same can sit next to each other, across or down.',
      '= between squares means they match; × means they are opposite.',
      'Tap to cycle ☀️ → 🌙 → empty. Fastest time wins.',
    ],
    modes: [{ id: 'easy', label: 'Easy' }, { id: 'hard', label: 'Hard' }],
    defaultMode: 'easy',
    scoreLabel: 'time',
    lowerIsBetter: true,
    formatScore: (s) => LB.util.fmtTime(s),
    generate,
    solve,

    start(api) {
      const el = api.el;
      const p = generate(api.mode === 'hard' ? 0 : 16);
      const g = p.givens.slice();
      const SYM = ['☀️', '🌙'];

      const board = el('div', { style: 'display:grid;grid-template-columns:repeat(' + N + ',1fr);gap:6px;max-width:400px;width:100%;margin:0 auto' });
      const cells = [];
      for (let i = 0; i < N * N; i++) {
        const fixed = p.givens[i] != null;
        const b = el('button', { class: 'cell', style: 'position:relative;overflow:visible;font-size:26px;border-radius:10px;' + (fixed ? 'background:var(--card-2);' : '') });
        b.addEventListener('click', () => {
          if (fixed) return;
          g[i] = g[i] == null ? 0 : g[i] === 0 ? 1 : null;
          api.sfx('tap'); draw(); check();
        });
        cells.push(b); board.append(b);
      }
      // Draw "=" and "×" badges on the shared edge between two squares.
      p.edges.forEach(({ a, b, type }) => {
        const across = b === a + 1;
        cells[a].append(el('span', { text: type, style: 'position:absolute;z-index:2;width:20px;height:20px;border-radius:50%;display:grid;place-items:center;'
          + 'font-size:14px;font-weight:900;background:var(--bg);color:var(--text);border:1.5px solid var(--muted);pointer-events:none;'
          + (across ? 'right:-14px;top:50%;transform:translateY(-50%)' : 'bottom:-14px;left:50%;transform:translateX(-50%)') }));
      });

      const prompt = el('div', { class: 'prompt', text: 'Three of each per row and column' });
      const controls = el('div', { class: 'row-btns', style: 'max-width:400px;width:100%;margin:0 auto' }, [
        el('button', { class: 'btn secondary', text: 'Start again', onclick: () => { p.givens.forEach((v, i) => { g[i] = v; }); draw(); } }),
      ]);
      api.root.append(prompt, board, controls);

      function errors() {
        const bad = new Set();
        const lines = [];
        for (let k = 0; k < N; k++) {
          lines.push([...Array(N).keys()].map((x) => k * N + x));
          lines.push([...Array(N).keys()].map((x) => x * N + k));
        }
        for (const line of lines) {
          for (const v of [0, 1]) {
            const hits = line.filter((i) => g[i] === v);
            if (hits.length > HALF) hits.forEach((i) => bad.add(i));
          }
          for (let x = 0; x + 2 < N; x++) {
            const [a, b, c] = [line[x], line[x + 1], line[x + 2]];
            if (g[a] != null && g[a] === g[b] && g[b] === g[c]) { bad.add(a); bad.add(b); bad.add(c); }
          }
        }
        for (const { a, b, type } of p.edges) {
          if (g[a] == null || g[b] == null) continue;
          if (type === '=' ? g[a] !== g[b] : g[a] === g[b]) { bad.add(a); bad.add(b); }
        }
        return bad;
      }

      function draw() {
        const bad = errors();
        cells.forEach((b, i) => {
          const badges = [...b.querySelectorAll('span')];
          b.textContent = g[i] == null ? '' : SYM[g[i]];
          b.append(...badges);
          b.style.boxShadow = bad.has(i) ? 'inset 0 0 0 3px var(--bad)' : '';
        });
        api.status(g.filter((v) => v != null).length + '/' + N * N);
      }

      function check() {
        if (g.some((v) => v == null) || errors().size) return;
        const t = Math.round(clock.stop());
        api.finish({ score: t, detail: 'Grid balanced' });
      }

      const clock = api.stopwatch();
      draw();
    },
  });
})();
