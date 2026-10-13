LB.register({
  id: 'odd-colour',
  name: 'Odd One Out',
  cat: 'focus',
  icon: '👁️',
  blurb: 'Spot the slightly different shade',
  trains: ['Visual perception', 'Attention to detail'],
  howTo: [
    'All the squares are the same colour – except one.',
    'Tap the odd one out. The grid grows and the difference shrinks.',
    'Wrong taps cost 3 seconds. You have 60 seconds.',
  ],
  scoreLabel: 'levels cleared',

  start(api) {
    const el = api.el, { rand, between } = api.util;
    let level = 0, over = false;

    const prompt = el('div', { class: 'prompt', text: 'Tap the different one' });
    const board = el('div', { class: 'board', style: 'max-width:380px;width:100%;gap:6px' });
    api.root.append(prompt, board);

    function next() {
      const size = Math.min(8, 2 + Math.floor(level / 3));
      const diff = Math.max(4, 28 - level * 1.2);
      const h = rand(360), s = between(45, 80), l = between(40, 65);
      const odd = rand(size * size);
      const lighter = Math.random() < 0.5 ? 1 : -1;
      board.style.gridTemplateColumns = 'repeat(' + size + ',1fr)';
      board.style.gap = size > 5 ? '4px' : '6px';
      board.innerHTML = '';
      for (let i = 0; i < size * size; i++) {
        const c = el('button', { class: 'cell', style: 'border:0;border-radius:' + (size > 5 ? 8 : 12) + 'px;background:hsl(' + h + ',' + s + '%,' + (i === odd ? l + lighter * diff / 2 : l) + '%)' });
        c.addEventListener('click', () => tap(i === odd, c));
        board.append(c);
      }
      api.status('Level ' + (level + 1));
    }

    function tap(ok, c) {
      if (over) return;
      if (ok) { level++; api.sfx('good'); next(); }
      else { timer.add(-3); api.sfx('bad'); api.buzz(80); api.util.flash(c, false); }
    }

    next();
    const timer = api.countdown(60, () => { over = true; api.finish({ score: level, detail: 'Your eyes for detail reached level ' + (level + 1) }); });
  },
});
