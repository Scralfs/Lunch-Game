LB.register({
  id: 'n-back',
  name: 'N-Back',
  cat: 'memory',
  icon: '🔁',
  blurb: 'The classic working-memory workout',
  trains: ['Working memory', 'Concentration'],
  howTo: [
    'A square lights up in a 3×3 grid, one position at a time.',
    'Tap MATCH when the position is the same as N steps ago.',
    'In 2-back, compare with the one before last. Stay quiet otherwise.',
    'Scored on accuracy across 20 turns.',
  ],
  modes: [{ id: '1', label: '1-back' }, { id: '2', label: '2-back' }, { id: '3', label: '3-back' }],
  defaultMode: '2',
  scoreLabel: 'accuracy',
  formatScore: (s) => s + '%',

  start(api) {
    const el = api.el;
    const n = Number(api.mode);
    const TURNS = 20;
    const total = TURNS + n;
    const STEP = 2500, SHOW = 600;

    // Build a sequence with roughly 30% matches.
    const seq = [];
    for (let i = 0; i < total; i++) {
      if (i >= n && Math.random() < 0.3) seq.push(seq[i - n]);
      else {
        let p;
        do { p = api.util.rand(9); } while (i >= n && p === seq[i - n]);
        seq.push(p);
      }
    }

    let i = -1, pressed = false, hits = 0, misses = 0, falseAlarms = 0, rejections = 0;

    const prompt = el('div', { class: 'prompt', text: 'Get ready…' });
    const board = el('div', { class: 'board', style: 'grid-template-columns:repeat(3,1fr);max-width:300px' });
    const cells = [];
    for (let k = 0; k < 9; k++) { const c = el('div', { class: 'cell' }); cells.push(c); board.append(c); }
    const matchBtn = el('button', { class: 'btn block', style: 'padding:22px;font-size:20px;max-width:300px', text: 'MATCH' });
    api.root.append(prompt, board, matchBtn);

    const isMatch = (k) => k >= n && seq[k] === seq[k - n];

    matchBtn.addEventListener('click', () => {
      if (i < n || pressed) return;
      pressed = true;
      if (isMatch(i)) { hits++; api.sfx('good'); matchBtn.style.background = 'var(--good)'; }
      else { falseAlarms++; api.sfx('bad'); api.buzz(100); matchBtn.style.background = 'var(--bad)'; }
    });

    function settle() {
      if (i < n) return;
      if (!pressed) {
        if (isMatch(i)) { misses++; api.util.flash(board, false); }
        else rejections++;
      }
    }

    function step() {
      settle();
      i++;
      if (i >= total) {
        const scored = hits + misses + falseAlarms + rejections;
        const acc = Math.round(((hits + rejections) / scored) * 100);
        api.finish({ score: acc, detail: hits + ' matches spotted · ' + misses + ' missed · ' + falseAlarms + ' false alarms' });
        return;
      }
      pressed = false;
      matchBtn.style.background = '';
      api.status(Math.max(0, i - n + 1) + ' / ' + TURNS);
      prompt.textContent = i < n ? 'Remember this one…' : 'Same as ' + n + ' back?';
      const c = cells[seq[i]];
      c.style.background = 'var(--memory)';
      api.sfx('tap');
      api.after(() => { c.style.background = ''; }, SHOW);
      api.after(step, STEP);
    }

    api.status('0 / ' + TURNS);
    api.after(step, 1000);
  },
});
