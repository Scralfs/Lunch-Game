LB.register({
  id: 'make-24',
  name: 'Make 24',
  cat: 'maths',
  icon: '2️⃣',
  blurb: 'Use all four numbers to make 24',
  trains: ['Mental arithmetic', 'Flexible thinking'],
  howTo: [
    'Combine all four numbers with + − × ÷ to make exactly 24.',
    'Tap a number, an operator, then another number. The result becomes a new tile.',
    'Undo if you go wrong. Skip if you are stuck; Reveal shows one answer but scores nothing.',
    'Sprint: solve as many as you can in 3 minutes. Relaxed: no clock – tap Done when you are full.',
  ],
  modes: [{ id: 'sprint', label: 'Sprint 3:00' }, { id: 'relaxed', label: 'Relaxed' }],
  defaultMode: 'sprint',
  scoreLabel: 'solved',

  start(api) {
    const el = api.el;
    const OPS = ['+', '−', '×', '÷'];
    const apply = (a, o, b) => (o === '+' ? a + b : o === '−' ? a - b : o === '×' ? a * b : b === 0 ? NaN : a / b);
    const is24 = (v) => Math.abs(v - 24) < 1e-6;
    const fmt = (v) => (Number.isInteger(v) ? v : Math.round(v * 100) / 100);

    function solve(nums) {
      const go = (l) => {
        if (l.length === 1) return is24(l[0].v) ? l[0].e : null;
        for (let i = 0; i < l.length; i++) for (let j = 0; j < l.length; j++) {
          if (i === j) continue;
          const rest = l.filter((_, k) => k !== i && k !== j);
          for (const o of OPS) {
            const v = apply(l[i].v, o, l[j].v);
            if (!isFinite(v)) continue;
            const r = go([...rest, { v, e: '(' + l[i].e + ' ' + o + ' ' + l[j].e + ')' }]);
            if (r) return r;
          }
        }
        return null;
      };
      return go(nums.map((n) => ({ v: n, e: String(n) })));
    }

    let tiles, hist, selA, selOp, orig, solved = 0, skipped = 0, busy = false, over = false;

    const msg = el('div', { class: 'prompt' });
    const tileRow = el('div', { style: 'display:grid;gap:10px' });
    const opRow = el('div', { style: 'display:grid;grid-template-columns:repeat(4,1fr);gap:10px' });
    const controls = el('div', { class: 'row-btns' }, [
      el('button', { class: 'btn secondary', text: '↶ Undo', onclick: undo }),
      el('button', { class: 'btn secondary', text: 'Skip', onclick: skip }),
      el('button', { class: 'btn secondary', text: 'Reveal', onclick: reveal }),
    ]);
    api.root.append(el('div', { class: 'big', style: 'font-size:22px;color:var(--muted)', text: 'Make 24' }), tileRow, opRow, msg, controls);
    if (api.mode === 'relaxed') {
      api.root.append(el('button', { class: 'btn block', text: 'Done', onclick: () => end() }));
    }

    function newPuzzle() {
      let n;
      do { n = [0, 0, 0, 0].map(() => api.util.between(1, 9)); } while (!solve(n));
      orig = n;
      tiles = n.map((v) => ({ v }));
      hist = []; selA = null; selOp = null; busy = false;
      msg.textContent = 'Combine all four numbers to make 24';
      draw();
    }

    function draw() {
      tileRow.innerHTML = '';
      tileRow.style.gridTemplateColumns = 'repeat(' + tiles.length + ',1fr)';
      tiles.forEach((t, i) => {
        const b = el('button', { class: 'cell', style: 'aspect-ratio:auto;padding:22px 0;font-size:28px', text: fmt(t.v) });
        if (selA === i) { b.style.background = 'var(--maths)'; b.style.color = '#fff'; }
        b.addEventListener('click', () => pick(i));
        tileRow.append(b);
      });
      opRow.innerHTML = '';
      OPS.forEach((o) => {
        const b = el('button', { class: 'cell', style: 'aspect-ratio:auto;padding:14px 0;font-size:26px;background:var(--card-2)', text: o });
        if (selOp === o) b.style.outline = '3px solid var(--maths)';
        b.addEventListener('click', () => { if (selA !== null && !busy) { selOp = o; api.sfx('tap'); draw(); } });
        opRow.append(b);
      });
      api.status('✓ ' + solved);
    }

    function pick(i) {
      if (busy || over) return;
      api.sfx('tap');
      if (selA === null) { selA = i; draw(); return; }
      if (selA === i) { selA = null; selOp = null; draw(); return; }
      if (!selOp) { selA = i; draw(); return; }
      const v = apply(tiles[selA].v, selOp, tiles[i].v);
      if (!isFinite(v)) { msg.textContent = 'Cannot divide by zero'; api.sfx('bad'); return; }
      hist.push(tiles.map((x) => Object.assign({}, x)));
      const keep = tiles.filter((_, k) => k !== selA && k !== i);
      keep.push({ v });
      tiles = keep; selA = null; selOp = null;
      draw();
      if (tiles.length === 1) {
        if (is24(tiles[0].v)) {
          solved++; busy = true;
          api.sfx('good'); api.util.flash(tileRow, true);
          msg.textContent = '24! Nicely done.';
          draw();
          api.after(newPuzzle, 900);
        } else {
          api.sfx('bad'); api.buzz(80);
          msg.textContent = 'Got ' + fmt(tiles[0].v) + '. Undo and try again.';
        }
      }
    }

    function undo() {
      if (busy || over || !hist.length) return;
      tiles = hist.pop(); selA = null; selOp = null;
      msg.textContent = 'Combine all four numbers to make 24';
      draw();
    }
    function skip() {
      if (busy || over) return;
      skipped++;
      newPuzzle();
    }
    function reveal() {
      if (busy || over) return;
      busy = true; skipped++;
      msg.textContent = 'One answer: ' + solve(orig).replace(/^\((.*)\)$/, '$1');
      api.after(newPuzzle, 3000);
    }

    function end() {
      if (over) return;
      over = true;
      api.finish({ score: solved, detail: solved + ' solved' + (skipped ? ' · ' + skipped + ' skipped' : '') });
    }

    newPuzzle();
    if (api.mode !== 'relaxed') api.countdown(180, end);
  },
});
