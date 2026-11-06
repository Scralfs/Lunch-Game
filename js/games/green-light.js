LB.register({
  id: 'green-light',
  name: 'Green Light',
  cat: 'speed',
  icon: '🟢',
  blurb: 'Tap the greens, hold back on the reds',
  trains: ['Processing speed', 'Impulse control'],
  howTo: [
    'Circles pop up around the screen.',
    'Tap green ones as fast as you can: +1 each.',
    'Leave red ones alone – tapping one costs 2 points.',
    'They get quicker as you go. 45 seconds.',
  ],
  scoreLabel: 'points',

  start(api) {
    const el = api.el;
    const DURATION = 45;
    let score = 0, hits = 0, misses = 0, redTaps = 0, over = false, current = null;
    const reactions = [];
    const started = Date.now();

    const arena = el('div', { style: 'position:relative;width:100%;flex:1;min-height:360px;max-height:560px;border-radius:24px;background:var(--card);border:1px solid var(--line);overflow:hidden;touch-action:manipulation' });
    const prompt = el('div', { class: 'prompt', text: 'Green = tap · Red = leave it' });
    api.root.append(prompt, arena);

    function spawn() {
      if (over) return;
      const elapsed = (Date.now() - started) / 1000;
      const life = Math.max(550, 1150 - elapsed * 14);
      const isGreen = Math.random() < 0.7;
      const size = 74;
      const x = api.util.between(8, Math.max(8, arena.clientWidth - size - 8));
      const y = api.util.between(8, Math.max(8, arena.clientHeight - size - 8));
      const dot = el('div', { style: 'position:absolute;left:' + x + 'px;top:' + y + 'px;width:' + size + 'px;height:' + size + 'px;border-radius:50%;'
        + 'background:' + (isGreen ? '#1fbf6a' : '#e0213a') + ';box-shadow:0 6px 16px rgba(0,0,0,.25);animation:pop .18s' });
      const born = performance.now();
      const c = current = { dot, isGreen, tapped: false };
      dot.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        if (over || c.tapped) return;
        c.tapped = true;
        dot.remove();
        if (isGreen) { score++; hits++; reactions.push(performance.now() - born); api.sfx('good'); }
        else { score = Math.max(0, score - 2); redTaps++; api.sfx('bad'); api.buzz(150); api.util.flash(arena, false); }
        api.status('Score ' + score);
      });
      arena.append(dot);
      api.after(() => {
        if (!c.tapped) {
          dot.remove();
          if (isGreen) misses++;
        }
        if (current === c) current = null;
        api.after(spawn, api.util.between(200, 550));
      }, life);
    }

    api.status('Score 0');
    api.after(spawn, 600);
    api.countdown(DURATION, () => {
      over = true;
      if (current) current.dot.remove();
      const avg = reactions.length ? Math.round(reactions.reduce((a, b) => a + b, 0) / reactions.length) : 0;
      api.finish({ score, detail: hits + ' greens · ' + misses + ' missed · ' + redTaps + ' red tap' + (redTaps === 1 ? '' : 's') + (avg ? '<br>Average reaction ' + avg + ' ms' : '') });
    });
  },
});
