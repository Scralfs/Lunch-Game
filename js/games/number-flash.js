LB.register({
  id: 'number-flash',
  name: 'Chimp Test',
  cat: 'memory',
  icon: '🐒',
  blurb: 'Memorise where the numbers were',
  trains: ['Short-term memory', 'Spatial memory'],
  howTo: [
    'Numbers appear scattered across the grid.',
    'Tap 1 first – the rest are then hidden.',
    'Tap the hidden squares in order, 1, 2, 3…',
    'Each level adds a number. 3 strikes and you are out.',
  ],
  scoreLabel: 'numbers remembered',

  start(api) {
    const el = api.el;
    const COLS = 5, ROWS = 6, N = COLS * ROWS;
    let count = 4, strikes = 0, best = 0, next = 1, locked = false;

    const prompt = el('div', { class: 'prompt' });
    const board = el('div', { class: 'board', style: 'grid-template-columns:repeat(' + COLS + ',1fr);max-width:360px;gap:6px' });
    const cells = [];
    for (let i = 0; i < N; i++) {
      const c = el('button', { class: 'cell', style: 'visibility:hidden;font-size:22px' });
      c.addEventListener('click', () => tap(c));
      cells.push(c); board.append(c);
    }
    api.root.append(prompt, board);

    function hud() { api.status(['Level ' + count, '✖'.repeat(strikes) + '○'.repeat(3 - strikes)]); }

    function round() {
      hud();
      next = 1; locked = false;
      prompt.textContent = 'Memorise, then tap 1';
      cells.forEach((c) => { c.style.visibility = 'hidden'; c.textContent = ''; c.dataset.n = ''; c.style.background = ''; });
      api.util.shuffle([...Array(N).keys()]).slice(0, count).forEach((pos, k) => {
        const c = cells[pos];
        c.style.visibility = 'visible';
        c.textContent = k + 1;
        c.dataset.n = k + 1;
      });
    }

    function tap(c) {
      const n = Number(c.dataset.n);
      if (!n || locked) return;
      if (n === next) {
        api.sfx('tap');
        c.style.visibility = 'hidden';
        c.dataset.n = '';
        if (next === 1) {
          prompt.textContent = 'Now the rest, in order';
          cells.forEach((x) => { if (x.dataset.n) { x.textContent = ''; x.style.background = 'var(--memory)'; } });
        }
        next++;
        if (next > count) {
          best = Math.max(best, count);
          api.sfx('good');
          count++;
          locked = true;
          prompt.textContent = 'Perfect! ✓';
          api.after(round, 700);
        }
      } else {
        api.sfx('bad'); api.buzz(120);
        locked = true;
        strikes++;
        hud();
        // Reveal the answer briefly
        cells.forEach((x) => { if (x.dataset.n) { x.textContent = x.dataset.n; x.style.background = Number(x.dataset.n) === next ? 'var(--good)' : ''; } });
        c.style.background = 'var(--bad)';
        prompt.textContent = 'Not quite – ' + next + ' was next';
        api.after(() => {
          if (strikes >= 3) api.finish({ score: best, detail: best ? 'Best level cleared: ' + best + ' numbers' : 'Chimps manage about 9 – you can too!' });
          else round();
        }, 1400);
      }
    }

    round();
  },
});
