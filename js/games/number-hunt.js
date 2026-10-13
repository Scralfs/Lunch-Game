LB.register({
  id: 'number-hunt',
  name: 'Number Hunt',
  cat: 'focus',
  icon: '🔢',
  blurb: 'Find 1 to 25 as fast as you can',
  trains: ['Visual search', 'Peripheral vision', 'Focus'],
  howTo: [
    'The numbers 1–25 are scattered in a 5×5 grid.',
    'Tap them in order as fast as you can.',
    'Wrong taps add a 2-second penalty. Lowest time wins.',
    'Tip: keep your eyes on the centre and use your peripheral vision.',
  ],
  scoreLabel: 'seconds',
  lowerIsBetter: true,
  formatScore: (s) => s.toFixed(1) + 's',

  start(api) {
    const el = api.el;
    const N = 25;
    let next = 1, penalty = 0;

    const prompt = el('div', { class: 'prompt', html: 'Find <b>1</b>' });
    const board = el('div', { class: 'board', style: 'grid-template-columns:repeat(5,1fr);max-width:380px;gap:6px' });
    const hues = ['--memory', '--maths', '--focus', '--words', '--speed'];
    api.util.shuffle([...Array(N).keys()].map((i) => i + 1)).forEach((n) => {
      const c = el('button', { class: 'cell', text: n, style: 'font-size:' + api.util.between(18, 28) + 'px;color:var(' + api.util.pick(hues) + ')' });
      c.addEventListener('click', () => tap(n, c));
      board.append(c);
    });
    api.root.append(prompt, board);
    const clock = api.stopwatch();

    function tap(n, c) {
      if (n === next) {
        api.sfx('tap');
        c.style.opacity = '.2';
        next++;
        if (next > N) {
          const t = clock.stop() + penalty;
          api.finish({ score: Math.round(t * 10) / 10, detail: penalty ? 'Including ' + penalty + 's of penalties' : 'Clean run – no wrong taps!' });
          return;
        }
        prompt.innerHTML = 'Find <b>' + next + '</b>';
      } else if (n > next) {
        penalty += 2;
        api.sfx('bad'); api.buzz(80); api.util.flash(c, false);
        api.status('+' + penalty + 's');
      }
    }
  },
});
