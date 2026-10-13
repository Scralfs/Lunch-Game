LB.register({
  id: 'reaction',
  name: 'Reflex',
  cat: 'speed',
  icon: '⚡',
  blurb: 'How fast are your reactions?',
  trains: ['Reaction time', 'Alertness'],
  howTo: [
    'Wait for the panel to turn green, then tap as fast as you can.',
    'Tap too early and that go is restarted.',
    'Five goes – your average is your score. Lower is better.',
  ],
  scoreLabel: 'average reaction',
  lowerIsBetter: true,
  formatScore: (s) => s + ' ms',

  start(api) {
    const el = api.el;
    const ROUNDS = 5;
    const times = [];
    let state = 'idle', goAt = 0, early = 0, token = 0;

    const panel = el('button', { style: 'width:100%;flex:1;max-height:460px;min-height:300px;border-radius:28px;color:#fff;font-size:26px;font-weight:800;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;transition:background .1s' });
    const log = el('div', { class: 'prompt' });
    api.root.append(panel, log);

    function set(bg, title, sub) {
      panel.style.background = bg;
      panel.innerHTML = '';
      panel.append(el('div', { text: title }), sub ? el('div', { style: 'font-size:15px;font-weight:600;opacity:.85', text: sub }) : '');
    }

    function arm() {
      const mine = ++token;
      state = 'waiting';
      set('#c2334a', 'Wait for green…', 'Go ' + (times.length + 1) + ' of ' + ROUNDS);
      api.after(() => {
        // An early tap bumps the token, so a stale timer can't turn the panel green.
        if (mine !== token || state !== 'waiting') return;
        state = 'go'; goAt = performance.now(); set('#1fbf6a', 'TAP!'); api.sfx('go');
      }, 1200 + Math.random() * 2800);
    }

    panel.addEventListener('pointerdown', () => {
      if (state === 'idle') { arm(); return; }
      if (state === 'waiting') {
        early++; token++;
        state = 'idle';
        api.sfx('bad'); api.buzz(150);
        set('#7a5cff', 'Too soon!', 'Tap to try that go again');
        return;
      }
      if (state !== 'go') return;
      const ms = Math.round(performance.now() - goAt);
      times.push(ms);
      api.sfx('good');
      log.textContent = times.map((t) => t + ' ms').join(' · ');
      api.status(times.length + ' / ' + ROUNDS);
      if (times.length >= ROUNDS) {
        state = 'done';
        const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
        set('#3b2a7a', avg + ' ms', 'average');
        api.finish({ score: avg, detail: 'Fastest ' + Math.min(...times) + ' ms' + (early ? ' · ' + early + ' early tap' + (early > 1 ? 's' : '') : '') });
      } else {
        state = 'idle';
        set('#3b2a7a', ms + ' ms', 'Tap to go again');
      }
    });

    api.status('0 / ' + ROUNDS);
    set('#3b2a7a', 'Tap to start', 'Tap the moment it turns green');
  },
});
