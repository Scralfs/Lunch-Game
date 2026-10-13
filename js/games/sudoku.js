LB.register({
  id: 'sudoku',
  name: 'Sudoku',
  cat: 'logic',
  icon: '🔲',
  blurb: 'The classic 9×9 number puzzle',
  trains: ['Logical reasoning', 'Concentration'],
  howTo: [
    'Fill the grid so every row, column and 3×3 box contains 1–9 once.',
    'Tap a square, then a number. Turn on Notes to pencil in candidates.',
    'Clashes are shown in red. Fastest time wins.',
  ],
  modes: [{ id: 'easy', label: 'Easy' }, { id: 'medium', label: 'Medium' }, { id: 'hard', label: 'Hard' }],
  defaultMode: 'easy',
  scoreLabel: 'time',
  lowerIsBetter: true,
  formatScore: (s) => LB.util.fmtTime(s),

  start(api) {
    const el = api.el, { shuffle } = api.util;

    /* --- Generator --- */
    const canPlace = (g, i, v) => {
      const r = Math.floor(i / 9), c = i % 9;
      const br = r - (r % 3), bc = c - (c % 3);
      for (let k = 0; k < 9; k++) {
        if (g[r * 9 + k] === v || g[k * 9 + c] === v) return false;
        if (g[(br + Math.floor(k / 3)) * 9 + bc + (k % 3)] === v) return false;
      }
      return true;
    };
    function fill(g) {
      const i = g.indexOf(0);
      if (i < 0) return true;
      for (const v of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
        if (canPlace(g, i, v)) { g[i] = v; if (fill(g)) return true; g[i] = 0; }
      }
      return false;
    }
    function countSolutions(g, limit) {
      let best = -1, bestCount = 10;
      for (let i = 0; i < 81; i++) {
        if (g[i]) continue;
        let n = 0;
        for (let v = 1; v <= 9; v++) if (canPlace(g, i, v)) n++;
        if (n < bestCount) { bestCount = n; best = i; if (n === 0) return 0; }
      }
      if (best < 0) return 1;
      let total = 0;
      for (let v = 1; v <= 9 && total < limit; v++) {
        if (canPlace(g, best, v)) { g[best] = v; total += countSolutions(g, limit - total); g[best] = 0; }
      }
      return total;
    }
    const solution = Array(81).fill(0);
    fill(solution);
    const puzzle = solution.slice();
    const targetGivens = { easy: 40, medium: 32, hard: 26 }[api.mode] || 40;
    let givens = 81;
    for (const i of shuffle([...Array(81).keys()])) {
      if (givens <= targetGivens) break;
      const keep = puzzle[i];
      puzzle[i] = 0;
      if (countSolutions(puzzle.slice(), 2) !== 1) puzzle[i] = keep; else givens--;
    }

    /* --- State & UI --- */
    const grid = puzzle.slice();
    const notes = Array.from({ length: 81 }, () => new Set());
    let selected = -1, notesMode = false, mistakes = 0;

    const board = el('div', { style: 'display:grid;grid-template-columns:repeat(9,1fr);max-width:400px;width:100%;margin:0 auto;border:2px solid var(--text);border-radius:10px;overflow:hidden;background:var(--card)' });
    const cells = [];
    for (let i = 0; i < 81; i++) {
      const r = Math.floor(i / 9), c = i % 9;
      const b = el('button', { style: 'aspect-ratio:1;display:grid;place-items:center;font-size:20px;font-weight:700;padding:0;'
        + 'border-right:' + (c === 8 ? '0' : c % 3 === 2 ? '2px solid var(--text)' : '1px solid var(--line)') + ';'
        + 'border-bottom:' + (r === 8 ? '0' : r % 3 === 2 ? '2px solid var(--text)' : '1px solid var(--line)') });
      b.addEventListener('click', () => { selected = i; api.sfx('tap'); draw(); });
      cells.push(b); board.append(b);
    }

    const pad = el('div', { style: 'display:grid;grid-template-columns:repeat(9,1fr);gap:4px;max-width:400px;width:100%;margin:0 auto' });
    for (let v = 1; v <= 9; v++) {
      const b = el('button', { class: 'cell', style: 'aspect-ratio:auto;padding:12px 0;font-size:20px', text: v });
      b.addEventListener('click', () => enter(v));
      pad.append(b);
    }
    const notesBtn = el('button', { class: 'btn secondary', text: '✏️ Notes: off', onclick: () => { notesMode = !notesMode; notesBtn.textContent = '✏️ Notes: ' + (notesMode ? 'on' : 'off'); notesBtn.classList.toggle('secondary', !notesMode); } });
    const controls = el('div', { class: 'row-btns', style: 'max-width:400px;width:100%;margin:0 auto' }, [
      notesBtn,
      el('button', { class: 'btn secondary', text: '⌫ Erase', onclick: () => enter(0) }),
    ]);
    api.root.append(board, pad, controls);

    function clashes(i) {
      const v = grid[i];
      if (!v) return false;
      grid[i] = 0;
      const ok = canPlace(grid, i, v);
      grid[i] = v;
      return !ok;
    }

    function draw() {
      const sv = selected >= 0 ? grid[selected] : 0;
      const sr = Math.floor(selected / 9), sc = selected % 9;
      cells.forEach((b, i) => {
        const r = Math.floor(i / 9), c = i % 9;
        const v = grid[i];
        const related = selected >= 0 && (r === sr || c === sc || (Math.floor(r / 3) === Math.floor(sr / 3) && Math.floor(c / 3) === Math.floor(sc / 3)));
        let bg = '';
        if (related) bg = 'color-mix(in srgb, var(--logic) 12%, transparent)';
        if (sv && v === sv) bg = 'color-mix(in srgb, var(--logic) 35%, transparent)';
        if (i === selected) bg = 'color-mix(in srgb, var(--logic) 60%, transparent)';
        b.style.background = bg;
        if (v) {
          b.textContent = v;
          b.style.fontSize = '20px';
          b.style.color = clashes(i) ? 'var(--bad)' : puzzle[i] ? 'var(--text)' : 'var(--maths)';
          b.style.fontWeight = puzzle[i] ? '800' : '600';
        } else if (notes[i].size) {
          b.innerHTML = '<span style="display:grid;grid-template-columns:repeat(3,1fr);font-size:9px;line-height:1.1;color:var(--muted);width:100%;text-align:center">'
            + [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => '<span>' + (notes[i].has(n) ? n : '&nbsp;') + '</span>').join('') + '</span>';
        } else b.textContent = '';
      });
      const filled = grid.filter(Boolean).length;
      api.status(Math.round((filled / 81) * 100) + '%');
    }

    function enter(v) {
      if (selected < 0 || puzzle[selected]) return;
      api.sfx('tap');
      if (v === 0) { grid[selected] = 0; notes[selected].clear(); draw(); return; }
      if (notesMode) {
        if (grid[selected]) return;
        if (notes[selected].has(v)) notes[selected].delete(v); else notes[selected].add(v);
        draw(); return;
      }
      grid[selected] = grid[selected] === v ? 0 : v;
      if (grid[selected]) {
        if (clashes(selected)) { mistakes++; api.sfx('bad'); api.buzz(60); }
        // Clear this number from notes in the same row, column and box
        const r = Math.floor(selected / 9), c = selected % 9;
        for (let i = 0; i < 81; i++) {
          const rr = Math.floor(i / 9), cc = i % 9;
          if (rr === r || cc === c || (Math.floor(rr / 3) === Math.floor(r / 3) && Math.floor(cc / 3) === Math.floor(c / 3))) notes[i].delete(v);
        }
      }
      draw();
      if (grid.every((x, i) => x === solution[i])) {
        const t = Math.round(clock.stop());
        api.finish({ score: t, detail: (api.mode[0].toUpperCase() + api.mode.slice(1)) + ' puzzle · ' + (mistakes ? mistakes + ' clash' + (mistakes > 1 ? 'es' : '') : 'no clashes') });
      }
    }

    function onKey(e) {
      if (/^[1-9]$/.test(e.key)) enter(Number(e.key));
      else if (e.key === 'Backspace' || e.key === '0') enter(0);
      else if (e.key.startsWith('Arrow') && selected >= 0) {
        const d = { ArrowUp: -9, ArrowDown: 9, ArrowLeft: -1, ArrowRight: 1 }[e.key];
        selected = (selected + d + 81) % 81; draw();
      }
    }
    document.addEventListener('keydown', onKey);
    api.onCleanup(() => document.removeEventListener('keydown', onKey));

    const clock = api.stopwatch();
    draw();
  },
});
