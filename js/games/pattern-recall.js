LB.register({
  id: 'pattern-recall',
  name: 'Sequence',
  cat: 'memory',
  icon: '💡',
  blurb: 'Repeat the glowing pattern',
  trains: ['Working memory', 'Sequencing'],
  howTo: [
    'Watch the tiles light up one after another, then tap them back in order.',
    'Classic: the same pattern grows by one each round. One mistake ends it.',
    'Trail: a bigger 4×4 grid and a brand-new pattern every round. You have 2 lives.',
  ],
  modes: [{ id: 'classic', label: 'Classic 3×3' }, { id: 'trail', label: 'Trail 4×4' }],
  defaultMode: 'classic',
  scoreLabel: 'longest sequence',

  start(api) {
    const el = api.el;
    const classic = api.mode !== 'trail';
    const SIZE = classic ? 3 : 4, N = SIZE * SIZE;
    let level = classic ? 1 : 3, lives = classic ? 1 : 2, best = 0, seq = [], input = 0, accepting = false;

    const prompt = el('div', { class: 'prompt' });
    const board = el('div', { class: 'board', style: 'grid-template-columns:repeat(' + SIZE + ',1fr);max-width:' + (classic ? 320 : 360) + 'px' });
    const cells = [];
    for (let i = 0; i < N; i++) {
      const c = el('button', { class: 'cell' });
      c.addEventListener('click', () => tap(i));
      cells.push(c); board.append(c);
    }
    api.root.append(prompt, board);

    function light(i, on, colour) {
      cells[i].style.background = on ? (colour || 'var(--memory)') : '';
      cells[i].style.transform = on ? 'scale(1.04)' : '';
    }
    function hud() { api.status(classic ? 'Level ' + best : ['Length ' + level, '❤️'.repeat(lives)]); }

    function round() {
      hud();
      accepting = false; input = 0;
      prompt.textContent = 'Watch…';
      if (classic) {
        seq.push(api.util.rand(N));
      } else {
        seq = [];
        while (seq.length < level) {
          const n = api.util.rand(N);
          if (n !== seq[seq.length - 1]) seq.push(n);
        }
      }
      const speed = Math.max(380, 650 - seq.length * 20);
      seq.forEach((n, k) => {
        api.after(() => { light(n, true); api.sfx('tap'); }, 600 + k * speed);
        api.after(() => light(n, false), 600 + k * speed + speed * 0.7);
      });
      api.after(() => { accepting = true; prompt.textContent = 'Your turn – ' + seq.length + ' tap' + (seq.length > 1 ? 's' : ''); }, 600 + seq.length * speed);
    }

    function tap(i) {
      if (!accepting) return;
      if (i === seq[input]) {
        light(i, true); api.sfx('tap');
        api.after(() => light(i, false), 180);
        input++;
        if (input === seq.length) {
          accepting = false;
          best = Math.max(best, seq.length);
          api.sfx('good');
          prompt.textContent = 'Correct! ✓';
          level++;
          hud();
          api.after(round, 800);
        }
      } else {
        accepting = false;
        light(i, true, 'var(--bad)');
        api.sfx('bad'); api.buzz(120);
        api.util.flash(board, false);
        lives--;
        hud();
        api.after(() => {
          light(i, false);
          if (lives <= 0) api.finish({ score: best, detail: best ? 'You remembered ' + best + ' step' + (best > 1 ? 's' : '') : 'Keep at it – it gets easier!' });
          else { prompt.textContent = 'Oops – try another of the same length'; api.after(round, 900); }
        }, 700);
      }
    }

    round();
  },
});
