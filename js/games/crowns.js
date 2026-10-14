(function () {
  'use strict';

  /* ---------- Puzzle generator ---------- */
  // Each puzzle is an n×n grid split into n coloured regions with exactly one solution:
  // one crown per row, column and region, and no two crowns touching (even diagonally).

  function randomPlacement(n, rng) {
    const cols = [];
    const used = new Set();
    const go = (r) => {
      if (r === n) return true;
      const order = [...Array(n).keys()].sort(() => rng() - 0.5);
      for (const c of order) {
        if (used.has(c) || (r > 0 && Math.abs(cols[r - 1] - c) < 2)) continue;
        cols.push(c); used.add(c);
        if (go(r + 1)) return true;
        cols.pop(); used.delete(c);
      }
      return false;
    };
    go(0);
    return cols;
  }

  function neighbours(n, i) {
    const r = Math.floor(i / n), c = i % n, out = [];
    if (r > 0) out.push(i - n);
    if (r < n - 1) out.push(i + n);
    if (c > 0) out.push(i - 1);
    if (c < n - 1) out.push(i + 1);
    return out;
  }

  function growRegions(n, sol, rng) {
    const region = Array(n * n).fill(-1);
    sol.forEach((c, r) => { region[r * n + c] = r; });
    let left = n * n - n;
    while (left > 0) {
      // Pick a random unassigned cell that touches a region and join it.
      const frontier = [];
      for (let i = 0; i < n * n; i++) {
        if (region[i] !== -1) continue;
        const adj = neighbours(n, i).filter((j) => region[j] !== -1);
        if (adj.length) frontier.push([i, adj]);
      }
      const [i, adj] = frontier[Math.floor(rng() * frontier.length)];
      region[i] = region[adj[Math.floor(rng() * adj.length)]];
      left--;
    }
    return region;
  }

  // Returns up to `limit` solutions as arrays of columns per row.
  function solve(n, region, limit) {
    const sols = [];
    const cols = [], usedC = new Set(), usedR = new Set();
    const go = (r) => {
      if (sols.length >= limit) return;
      if (r === n) { sols.push(cols.slice()); return; }
      for (let c = 0; c < n; c++) {
        const reg = region[r * n + c];
        if (usedC.has(c) || usedR.has(reg) || (r > 0 && Math.abs(cols[r - 1] - c) < 2)) continue;
        cols.push(c); usedC.add(c); usedR.add(reg);
        go(r + 1);
        cols.pop(); usedC.delete(c); usedR.delete(reg);
      }
    };
    go(0);
    return sols;
  }

  function connectedWithout(n, region, reg, skip) {
    const cells = [];
    for (let i = 0; i < n * n; i++) if (region[i] === reg && i !== skip) cells.push(i);
    if (!cells.length) return false;
    const seen = new Set([cells[0]]);
    const stack = [cells[0]];
    while (stack.length) {
      const i = stack.pop();
      for (const j of neighbours(n, i)) {
        if (j !== skip && region[j] === reg && !seen.has(j)) { seen.add(j); stack.push(j); }
      }
    }
    return seen.size === cells.length;
  }

  function generate(n, rng) {
    rng = rng || Math.random;
    for (let attempt = 0; attempt < 200; attempt++) {
      const sol = randomPlacement(n, rng);
      const region = growRegions(n, sol, rng);
      const isQueen = new Set(sol.map((c, r) => r * n + c));
      // Nudge region borders until the intended placement is the only solution.
      for (let step = 0; step < 60; step++) {
        const sols = solve(n, region, 2);
        if (sols.length === 1) return { n, region, solution: sol };
        const alt = sols.find((s) => s.some((c, r) => c !== sol[r]));
        const candidates = [];
        alt.forEach((c, r) => {
          const i = r * n + c;
          if (isQueen.has(i)) return;
          for (const j of neighbours(n, i)) {
            if (region[j] !== region[i] && connectedWithout(n, region, region[i], i)) candidates.push([i, region[j]]);
          }
        });
        if (!candidates.length) break;
        const [i, to] = candidates[Math.floor(rng() * candidates.length)];
        region[i] = to;
      }
    }
    return null;
  }

  /* ---------- Game ---------- */
  LB.register({
    id: 'crowns',
    name: 'Crowns',
    cat: 'logic',
    icon: '👑',
    blurb: 'One crown per row, column and colour',
    trains: ['Logical deduction', 'Spatial reasoning'],
    howTo: [
      'Place one 👑 in every row, every column and every coloured region.',
      'Crowns cannot touch each other – not even diagonally.',
      'Tap once to mark ✕ (a square you have ruled out), twice for a crown, three times to clear.',
      'Every puzzle has exactly one solution. Fastest time wins.',
    ],
    modes: [{ id: '6', label: '6×6' }, { id: '7', label: '7×7' }, { id: '8', label: '8×8' }],
    defaultMode: '7',
    scoreLabel: 'time',
    lowerIsBetter: true,
    formatScore: (s) => LB.util.fmtTime(s),
    generate,
    solve,

    start(api) {
      const el = api.el;
      const n = Number(api.mode) || 7;
      const puzzle = generate(n);
      const COLOURS = ['#c9b6ff', '#ffc59e', '#9fd8ff', '#b8eba0', '#ffe28a', '#ff9fb6', '#d2d2d2', '#9ee6d7', '#e9b8ff'];
      const state = Array(n * n).fill(0); // 0 empty, 1 cross, 2 crown

      const board = el('div', { style: 'display:grid;grid-template-columns:repeat(' + n + ',1fr);max-width:420px;width:100%;margin:0 auto;border:2px solid #222;border-radius:10px;overflow:hidden' });
      const cells = [];
      for (let i = 0; i < n * n; i++) {
        const r = Math.floor(i / n), c = i % n, reg = puzzle.region[i];
        const thick = '2px solid #222', thin = '1px solid rgba(0,0,0,.18)';
        const b = el('button', { style: 'aspect-ratio:1;display:grid;place-items:center;padding:0;color:#222;font-size:' + (n > 7 ? 20 : 24) + 'px;font-weight:800;'
          + 'background:' + COLOURS[reg] + ';'
          + 'border-right:' + (c === n - 1 ? '0' : puzzle.region[i + 1] !== reg ? thick : thin) + ';'
          + 'border-bottom:' + (r === n - 1 ? '0' : puzzle.region[i + n] !== reg ? thick : thin) });
        b.addEventListener('click', () => { state[i] = (state[i] + 1) % 3; api.sfx('tap'); draw(); check(); });
        cells.push(b); board.append(b);
      }
      const prompt = el('div', { class: 'prompt', text: 'Tap: ✕ → 👑 → clear' });
      const controls = el('div', { class: 'row-btns', style: 'max-width:420px;width:100%;margin:0 auto' }, [
        el('button', { class: 'btn secondary', text: 'Clear ✕ marks', onclick: () => { state.forEach((v, i) => { if (v === 1) state[i] = 0; }); draw(); } }),
        el('button', { class: 'btn secondary', text: 'Start again', onclick: () => { state.fill(0); draw(); } }),
      ]);
      api.root.append(prompt, board, controls);

      function conflicts() {
        const bad = new Set();
        const crowns = [];
        state.forEach((v, i) => { if (v === 2) crowns.push(i); });
        for (let a = 0; a < crowns.length; a++) {
          for (let b = a + 1; b < crowns.length; b++) {
            const i = crowns[a], j = crowns[b];
            const ri = Math.floor(i / n), ci = i % n, rj = Math.floor(j / n), cj = j % n;
            if (ri === rj || ci === cj || puzzle.region[i] === puzzle.region[j] || (Math.abs(ri - rj) < 2 && Math.abs(ci - cj) < 2)) { bad.add(i); bad.add(j); }
          }
        }
        return { bad, count: crowns.length };
      }

      function draw() {
        const { bad, count } = conflicts();
        cells.forEach((b, i) => {
          b.textContent = state[i] === 2 ? '👑' : state[i] === 1 ? '✕' : '';
          b.style.color = state[i] === 1 ? 'rgba(0,0,0,.45)' : '#222';
          b.style.boxShadow = bad.has(i) ? 'inset 0 0 0 3px #e0213a' : '';
        });
        api.status('👑 ' + count + '/' + n);
      }

      function check() {
        const { bad, count } = conflicts();
        if (count === n && bad.size === 0) {
          const t = Math.round(clock.stop());
          api.finish({ score: t, detail: n + '×' + n + ' board solved' });
        }
      }

      const clock = api.stopwatch();
      draw();
    },
  });
})();
