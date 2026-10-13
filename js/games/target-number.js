LB.register({
  id: 'target-number',
  name: 'Numbers Round',
  cat: 'maths',
  icon: '🎯',
  blurb: 'Hit the target with six numbers',
  trains: ['Mental arithmetic', 'Problem solving', 'Planning'],
  howTo: [
    'Combine the numbers with + − × ÷ to reach the target.',
    'Tap a number, an operator, then another number. The result becomes a new tile.',
    'Each number can be used once. You do not have to use them all.',
    'Exact = 10 points, within 5 = 7, within 10 = 5. Three rounds, 60 seconds each.',
  ],
  scoreLabel: 'points (out of 30)',

  start(api) {
    const el = api.el, { pick, shuffle, between } = api.util;
    const ROUNDS = 3;
    let round = 0, total = 0, tiles, history, sel, op, timer, done;

    const OPS = {
      '+': (a, b) => a + b,
      '−': (a, b) => a - b,
      '×': (a, b) => a * b,
      '÷': (a, b) => (b !== 0 && a % b === 0 ? a / b : NaN),
    };

    function deal() {
      const large = shuffle([25, 50, 75, 100]).slice(0, between(1, 2));
      const smallPool = shuffle([1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10]);
      const nums = large.concat(smallPool.slice(0, 6 - large.length));
      for (let tries = 0; tries < 2000; tries++) {
        const order = shuffle(nums).slice(0, between(3, 5));
        let v = order[0], ok = true;
        for (let k = 1; k < order.length; k++) {
          const o = pick(Object.keys(OPS));
          let a = v, b = order[k];
          if (o === '−' && b > a) [a, b] = [b, a];
          const r = OPS[o](a, b);
          if (!Number.isInteger(r) || r <= 0) { ok = false; break; }
          v = r;
        }
        if (ok && v >= 101 && v <= 999 && !nums.includes(v)) return { nums, target: v };
      }
      return { nums, target: between(101, 400) };
    }

    const targetEl = el('div', { class: 'big', style: 'font-size:56px;background:var(--card);border-radius:20px;padding:8px;border:1px solid var(--line)' });
    const prompt = el('div', { class: 'prompt' });
    const tileRow = el('div', { style: 'display:grid;grid-template-columns:repeat(3,1fr);gap:10px' });
    const opRow = el('div', { style: 'display:grid;grid-template-columns:repeat(4,1fr);gap:10px' });
    Object.keys(OPS).forEach((o) => {
      const b = el('button', { class: 'cell', style: 'aspect-ratio:auto;padding:14px 0;font-size:26px;background:var(--card-2)', text: o });
      b.addEventListener('click', () => chooseOp(o, b));
      opRow.append(b);
    });
    const log = el('div', { class: 'prompt', style: 'font-size:14px;min-height:40px' });
    const controls = el('div', { class: 'row-btns' }, [
      el('button', { class: 'btn secondary', text: '↶ Undo', onclick: undo }),
      el('button', { class: 'btn secondary', text: 'Reset', onclick: reset }),
      el('button', { class: 'btn', text: 'Lock in', onclick: () => lockIn() }),
    ]);
    api.root.append(targetEl, prompt, tileRow, opRow, log, controls);

    let deal0;
    function newRound() {
      round++;
      done = false;
      deal0 = deal();
      targetEl.textContent = deal0.target;
      api.status('R' + round + '/' + ROUNDS + ' · ' + total + ' pts');
      reset();
      if (timer) timer.stop();
      timer = api.countdown(60, () => lockIn(true));
    }

    function reset() {
      tiles = deal0.nums.map((v) => ({ v }));
      history = [];
      clearSel();
      draw();
    }
    function undo() {
      if (!history.length || done) return;
      tiles = history.pop();
      clearSel(); draw();
    }
    function clearSel() {
      sel = null; op = null;
      opRow.querySelectorAll('button').forEach((b) => (b.style.outline = ''));
    }

    function draw() {
      tileRow.innerHTML = '';
      tiles.forEach((t, i) => {
        const b = el('button', { class: 'cell', style: 'aspect-ratio:auto;padding:16px 0;font-size:24px', text: t.v });
        if (sel === i) { b.style.background = 'var(--maths)'; b.style.color = '#fff'; }
        if (t.made) b.style.borderColor = 'var(--maths)';
        b.addEventListener('click', () => chooseTile(i, b));
        tileRow.append(b);
      });
      const closest = best();
      prompt.textContent = closest == null ? '' : 'Closest so far: ' + closest + ' (' + (Math.abs(closest - deal0.target) === 0 ? 'bang on!' : Math.abs(closest - deal0.target) + ' away') + ')';
      log.textContent = (history.length ? history.map((h) => h.step).filter(Boolean).join('   ·   ') : 'Tap a number to start');
    }

    function chooseTile(i, b) {
      if (done) return;
      api.sfx('tap');
      if (sel == null || op == null) { sel = sel === i ? null : i; draw(); return; }
      if (i === sel) { clearSel(); draw(); return; }
      const a = tiles[sel].v, c = tiles[i].v;
      const r = OPS[op](a, c);
      if (!Number.isInteger(r) || r <= 0) {
        api.sfx('bad'); api.buzz(80); api.util.flash(b, false);
        prompt.textContent = op === '÷' ? 'Must divide exactly' : 'Results must be positive whole numbers';
        clearSel();
        return;
      }
      const snapshot = tiles.map((t) => Object.assign({}, t));
      snapshot.step = a + ' ' + op + ' ' + c + ' = ' + r;
      history.push(snapshot);
      const keep = tiles.filter((_, k) => k !== sel && k !== i);
      keep.push({ v: r, made: true });
      tiles = keep;
      clearSel();
      draw();
      if (r === deal0.target) { api.sfx('good'); lockIn(); }
    }

    function chooseOp(o, b) {
      if (done || sel == null) return;
      api.sfx('tap');
      op = o;
      opRow.querySelectorAll('button').forEach((x) => (x.style.outline = ''));
      b.style.outline = '3px solid var(--maths)';
    }

    function best() {
      if (!tiles) return null;
      return tiles.reduce((acc, t) => (acc == null || Math.abs(t.v - deal0.target) < Math.abs(acc - deal0.target) ? t.v : acc), null);
    }

    function lockIn(timeUp) {
      if (done) return;
      done = true;
      timer.stop();
      const b = best();
      const diff = Math.abs(b - deal0.target);
      const pts = diff === 0 ? 10 : diff <= 5 ? 7 : diff <= 10 ? 5 : 0;
      total += pts;
      api.status('R' + round + '/' + ROUNDS + ' · ' + total + ' pts');
      prompt.textContent = (timeUp ? "Time's up! " : '') + (diff === 0 ? 'Spot on! +10' : b + ' is ' + diff + ' away · +' + pts);
      api.sfx(pts ? 'good' : 'bad');
      api.after(() => {
        if (round >= ROUNDS) api.finish({ score: total, detail: 'Three rounds played' });
        else newRound();
      }, 1800);
    }

    newRound();
  },
});
