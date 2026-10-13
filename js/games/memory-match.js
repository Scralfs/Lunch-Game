LB.register({
  id: 'memory-match',
  name: 'Pair Up',
  cat: 'memory',
  icon: '🃏',
  blurb: 'Find every matching pair',
  trains: ['Visual memory', 'Spatial recall'],
  howTo: [
    'Tap two cards to flip them.',
    'Matching pairs stay face up; others flip back.',
    'Clear the board in as few moves and seconds as you can.',
  ],
  modes: [{ id: 'small', label: '4×4' }, { id: 'large', label: '4×5' }],
  defaultMode: 'small',
  scoreLabel: 'points',

  start(api) {
    const el = api.el, shuffle = api.util.shuffle;
    const SYMBOLS = ['🍎', '🍋', '🍇', '🥑', '🍩', '🌮', '🍕', '🥐', '🍪', '🧀', '🍓', '🥕'];
    const pairs = api.mode === 'large' ? 10 : 8;
    const deck = shuffle(shuffle(SYMBOLS).slice(0, pairs).flatMap((s) => [s, s]));

    let first = null, lock = false, moves = 0, found = 0;
    const clock = api.stopwatch();
    api.status('Moves 0');

    const board = el('div', { class: 'board', style: 'grid-template-columns:repeat(4,1fr);max-width:' + (api.mode === 'large' ? 340 : 380) + 'px' });
    deck.forEach((sym) => {
      const c = el('button', { class: 'cell', style: 'font-size:30px;background:var(--memory);border:0'});
      c.addEventListener('click', () => flip(c, sym));
      board.append(c);
    });
    api.root.append(board);

    function show(c, sym) { c.textContent = sym; c.style.background = 'var(--card)'; c.style.border = '1px solid var(--line)'; }
    function hide(c) { c.textContent = ''; c.style.background = 'var(--memory)'; c.style.border = '0'; }

    function flip(c, sym) {
      if (lock || c.dataset.open) return;
      api.sfx('tap');
      c.dataset.open = '1';
      show(c, sym);
      if (!first) { first = { c, sym }; return; }
      moves++;
      api.status('Moves ' + moves);
      if (first.sym === sym) {
        found++;
        api.sfx('good');
        api.util.flash(c, true); api.util.flash(first.c, true);
        c.style.opacity = first.c.style.opacity = '.55';
        first = null;
        if (found === pairs) {
          const secs = clock.stop();
          const score = Math.max(50, Math.round(1000 + pairs * 60 - (moves - pairs) * 30 - secs * 8));
          api.finish({ score, detail: moves + ' moves in ' + api.util.fmtTime(secs) });
        }
      } else {
        lock = true;
        const a = first.c;
        first = null;
        api.after(() => { delete a.dataset.open; delete c.dataset.open; hide(a); hide(c); lock = false; }, 750);
      }
    }
  },
});
