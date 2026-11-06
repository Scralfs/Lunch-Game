(function () {
  'use strict';

  /* ---------- Generator ---------- */
  // Random pictures are kept only if they can be solved line by line without guessing,
  // which also guarantees a single solution.

  const clueOf = (cells) => {
    const out = [];
    let run = 0;
    for (const v of cells) {
      if (v === 1) run++;
      else if (run) { out.push(run); run = 0; }
    }
    if (run) out.push(run);
    return out;
  };

  // line: 1 filled, 0 empty, -1 unknown. Returns the line with every forced cell set, or null if impossible.
  function solveLine(clue, line) {
    const n = line.length;
    const canF = Array(n).fill(false), canE = Array(n).fill(false), cur = Array(n).fill(0);
    let any = false;
    const place = (b, pos) => {
      if (b === clue.length) {
        for (let k = pos; k < n; k++) if (line[k] === 1) return;
        for (let k = 0; k < n; k++) { if (k < pos && cur[k]) canF[k] = true; else canE[k] = true; }
        any = true;
        return;
      }
      const len = clue[b];
      for (let s = pos; s + len <= n; s++) {
        if (s > pos && line[s - 1] === 1) break; // can't leave a filled cell uncovered
        let ok = true;
        for (let k = s; k < s + len; k++) if (line[k] === 0) { ok = false; break; }
        if (!ok || (s + len < n && line[s + len] === 1)) continue;
        for (let k = pos; k < s; k++) cur[k] = 0;
        for (let k = s; k < s + len; k++) cur[k] = 1;
        if (s + len < n) cur[s + len] = 0;
        place(b + 1, Math.min(n, s + len + 1));
      }
    };
    place(0, 0);
    if (!any) return null;
    return line.map((v, k) => (v !== -1 ? v : canF[k] && !canE[k] ? 1 : canE[k] && !canF[k] ? 0 : -1));
  }

  function lineSolvable(n, rowClues, colClues) {
    const g = Array(n * n).fill(-1);
    let changed = true;
    while (changed) {
      changed = false;
      for (let r = 0; r < n; r++) {
        const line = g.slice(r * n, r * n + n);
        const res = solveLine(rowClues[r], line);
        if (!res) return false;
        res.forEach((v, c) => { if (g[r * n + c] !== v) { g[r * n + c] = v; changed = true; } });
      }
      for (let c = 0; c < n; c++) {
        const line = [...Array(n).keys()].map((r) => g[r * n + c]);
        const res = solveLine(colClues[c], line);
        if (!res) return false;
        res.forEach((v, r) => { if (g[r * n + c] !== v) { g[r * n + c] = v; changed = true; } });
      }
    }
    return g.every((v) => v !== -1);
  }

  function generate(n, rng) {
    rng = rng || Math.random;
    for (let attempt = 0; attempt < 500; attempt++) {
      const density = 0.52 + rng() * 0.12;
      const sol = Array.from({ length: n * n }, () => (rng() < density ? 1 : 0));
      const rows = [...Array(n).keys()].map((r) => clueOf(sol.slice(r * n, r * n + n)));
      const cols = [...Array(n).keys()].map((c) => clueOf([...Array(n).keys()].map((r) => sol[r * n + c])));
      if (lineSolvable(n, rows, cols)) return { n, sol, rows, cols };
    }
    return null;
  }

  /* ---------- Game ---------- */
  LB.register({
    id: 'picture-grid',
    name: 'Picture Grid',
    cat: 'logic',
    icon: '🖼️',
    blurb: 'Shade the squares the number clues describe',
    trains: ['Logical deduction', 'Concentration'],
    howTo: [
      'The numbers by each row and column give the runs of shaded squares, in order.',
      '“3 1” means a run of 3, a gap of at least one, then a run of 1.',
      'Drag across squares to shade several. Switch to ✕ to mark squares you know are empty.',
      'Every puzzle can be solved by logic alone – no guessing. Fastest time wins.',
    ],
    modes: [{ id: '5', label: '5×5' }, { id: '8', label: '8×8' }, { id: '10', label: '10×10' }],
    defaultMode: '8',
    scoreLabel: 'time',
    lowerIsBetter: true,
    formatScore: (s) => LB.util.fmtTime(s),
    generate,
    solveLine,

    start(api) {
      const el = api.el;
      const n = Number(api.mode) || 8;
      const p = generate(n);
      const g = Array(n * n).fill(0); // 0 empty, 1 shaded, 2 crossed
      let tool = 1, done = false;

      const cellPx = n <= 5 ? 48 : n <= 8 ? 34 : 28;
      const board = el('div', { style: 'display:grid;grid-template-columns:auto repeat(' + n + ',' + cellPx + 'px);grid-auto-rows:auto;gap:0;margin:0 auto;width:auto;max-width:100%;touch-action:none' });
      const thick = (k) => k % 5 === 4 && k < n - 1;

      board.append(el('div'));
      const colClueEls = p.cols.map((clue, c) => {
        const d = el('div', { style: 'display:flex;flex-direction:column;justify-content:flex-end;align-items:center;font-size:' + (n > 8 ? 11 : 13) + 'px;font-weight:700;line-height:1.15;padding-bottom:4px', html: (clue.length ? clue : [0]).join('<br>') });
        board.append(d);
        return d;
      });
      const rowClueEls = [];
      const cells = [];
      for (let r = 0; r < n; r++) {
        const rc = el('div', { style: 'display:flex;align-items:center;justify-content:flex-end;gap:5px;padding-right:6px;font-size:' + (n > 8 ? 11 : 13) + 'px;font-weight:700;white-space:nowrap', text: (p.rows[r].length ? p.rows[r] : [0]).join(' ') });
        rowClueEls.push(rc); board.append(rc);
        for (let c = 0; c < n; c++) {
          const i = r * n + c;
          const b = el('div', { 'data-i': i, style: 'width:' + cellPx + 'px;height:' + cellPx + 'px;display:grid;place-items:center;font-size:' + Math.round(cellPx * 0.5) + 'px;color:var(--muted);background:var(--card);'
            + 'border-left:' + (c === 0 ? '2px solid var(--text)' : '1px solid var(--line)') + ';'
            + 'border-top:' + (r === 0 ? '2px solid var(--text)' : '1px solid var(--line)') + ';'
            + 'border-right:' + (c === n - 1 ? '2px solid var(--text)' : thick(c) ? '2px solid var(--muted)' : '0') + ';'
            + 'border-bottom:' + (r === n - 1 ? '2px solid var(--text)' : thick(r) ? '2px solid var(--muted)' : '0') });
          cells.push(b); board.append(b);
        }
      }

      const toolBtn = el('button', { class: 'btn', text: '■ Shade', onclick: () => {
        tool = tool === 1 ? 2 : 1;
        toolBtn.textContent = tool === 1 ? '■ Shade' : '✕ Mark empty';
        toolBtn.classList.toggle('secondary', tool === 2);
      } });
      const controls = el('div', { class: 'row-btns', style: 'max-width:420px;width:100%;margin:0 auto' }, [
        toolBtn,
        el('button', { class: 'btn secondary', text: 'Start again', onclick: () => { g.fill(0); draw(); } }),
      ]);
      api.root.append(el('div', { style: 'overflow-x:auto;width:100%;display:flex;justify-content:center' }, board), controls);

      // Drag painting: the first square decides whether this stroke paints or erases.
      let paint = null;
      const at = (e) => {
        const t = document.elementFromPoint(e.clientX, e.clientY);
        return t && t.dataset && t.dataset.i != null && board.contains(t) ? Number(t.dataset.i) : null;
      };
      board.addEventListener('pointerdown', (e) => {
        const i = at(e);
        if (i == null || done) return;
        e.preventDefault();
        paint = g[i] === tool ? 0 : tool;
        g[i] = paint; api.sfx('tap'); draw();
      });
      const onMove = (e) => {
        if (paint == null) return;
        const i = at(e);
        if (i != null && g[i] !== paint && !(paint !== 0 && g[i] !== 0)) { g[i] = paint; draw(); }
      };
      const onUp = () => { if (paint != null) { paint = null; check(); } };
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
      api.onCleanup(() => { document.removeEventListener('pointermove', onMove); document.removeEventListener('pointerup', onUp); });

      const sameClue = (a, b) => a.length === b.length && a.every((v, k) => v === b[k]);
      function draw() {
        cells.forEach((b, i) => {
          b.style.background = g[i] === 1 ? 'var(--text)' : 'var(--card)';
          b.textContent = g[i] === 2 ? '✕' : '';
        });
        for (let r = 0; r < n; r++) {
          const ok = sameClue(clueOf(g.slice(r * n, r * n + n)), p.rows[r]);
          rowClueEls[r].style.opacity = ok ? '.35' : '1';
        }
        for (let c = 0; c < n; c++) {
          const ok = sameClue(clueOf([...Array(n).keys()].map((r) => g[r * n + c])), p.cols[c]);
          colClueEls[c].style.opacity = ok ? '.35' : '1';
        }
        api.status(Math.round((g.filter((v) => v === 1).length / p.sol.filter(Boolean).length) * 100) + '%');
      }

      function check() {
        if (done) return;
        if (p.sol.every((v, i) => (v === 1) === (g[i] === 1))) {
          done = true;
          const t = Math.round(clock.stop());
          api.finish({ score: t, detail: n + '×' + n + ' grid solved' });
        }
      }

      const clock = api.stopwatch();
      draw();
    },
  });
})();
