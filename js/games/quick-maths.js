LB.register({
  id: 'quick-maths',
  name: 'Quick Maths',
  cat: 'maths',
  icon: '🧮',
  blurb: '60 seconds of mental arithmetic',
  trains: ['Mental arithmetic', 'Processing speed'],
  howTo: [
    'Answer as many sums as you can in 60 seconds.',
    'Answers are checked automatically as you type.',
    'Sums get harder the better you do. Skipping costs 3 seconds.',
  ],
  scoreLabel: 'correct answers',

  start(api) {
    const el = api.el, { between, pick } = api.util;
    let correct = 0, wrong = 0, entry = '', q = null, over = false;

    function make() {
      const lvl = Math.min(4, Math.floor(correct / 5));
      const op = pick(lvl === 0 ? ['+', '−'] : lvl === 1 ? ['+', '−', '×'] : ['+', '−', '×', '÷']);
      let a, b, ans;
      const big = [10, 20, 50, 100, 200][lvl];
      if (op === '+') { a = between(2, big); b = between(2, big); ans = a + b; }
      if (op === '−') { a = between(3, big); b = between(1, a); ans = a - b; }
      if (op === '×') { const m = [6, 9, 12, 12, 15][lvl]; a = between(2, m); b = between(2, lvl > 2 ? 15 : 9); ans = a * b; }
      if (op === '÷') { b = between(2, 12); ans = between(2, lvl > 3 ? 15 : 12); a = b * ans; }
      return { text: a + ' ' + op + ' ' + b, ans: String(ans) };
    }

    const question = el('div', { class: 'big' });
    const box = el('div', { class: 'answer-box' });
    const pad = el('div', { class: 'keypad' });
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'Skip'].forEach((k) => {
      const b = el('button', { text: k });
      if (k === 'Skip') b.style.fontSize = '16px';
      b.addEventListener('click', () => press(k));
      pad.append(b);
    });
    api.root.append(question, box, pad);

    function next() { q = make(); entry = ''; question.textContent = q.text + ' ='; box.textContent = ''; }
    function hud() { api.status('✓ ' + correct); }

    function press(k) {
      if (over) return;
      if (k === '⌫') { entry = entry.slice(0, -1); box.textContent = entry; return; }
      if (k === 'Skip') { timer.add(-3); api.sfx('bad'); next(); return; }
      api.sfx('tap');
      entry += k;
      box.textContent = entry;
      if (entry === q.ans) {
        correct++; hud(); api.sfx('good'); api.util.flash(box, true); next();
      } else if (entry.length >= q.ans.length) {
        wrong++; api.sfx('bad'); api.buzz(80); api.util.flash(box, false);
        api.after(() => { entry = ''; box.textContent = ''; }, 250);
      }
    }

    function onKey(e) {
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') press('⌫');
    }
    document.addEventListener('keydown', onKey);
    api.onCleanup(() => document.removeEventListener('keydown', onKey));

    hud(); next();
    const timer = api.countdown(60, () => {
      over = true;
      api.finish({ score: correct, detail: wrong ? wrong + ' slip' + (wrong === 1 ? '' : 's') + ' along the way' : 'Not a single slip – impressive!' });
    });
  },
});
