(function () {
  'use strict';

  const COLOURS = ['#ff4d5e', '#ff9f1c', '#ffd23f', '#2ec4b6', '#3b8cff', '#a463f2'];
  const LABELS = ['1', '2', '3', '4', '5', '6']; // numbers on the pegs help colour-blind players
  const SLOTS = 4, TRIES = 10;

  // Black = right colour, right place. White = right colour, wrong place.
  function score(secret, guess) {
    let black = 0;
    const s = [], g = [];
    for (let i = 0; i < SLOTS; i++) {
      if (secret[i] === guess[i]) black++;
      else { s.push(secret[i]); g.push(guess[i]); }
    }
    let white = 0;
    for (const v of g) {
      const k = s.indexOf(v);
      if (k >= 0) { white++; s.splice(k, 1); }
    }
    return { black, white };
  }

  LB.register({
    id: 'code-breaker',
    name: 'Code Breaker',
    cat: 'logic',
    icon: '🔐',
    blurb: 'Crack the hidden colour code',
    trains: ['Deduction', 'Working memory', 'Hypothesis testing'],
    howTo: [
      'A secret code of 4 coloured pegs is hidden. Crack it in 10 guesses or fewer.',
      'After each guess: ● = right colour in the right place, ○ = right colour in the wrong place.',
      'The clues do not say which pegs they refer to – that is the puzzle.',
      'No repeats: every colour in the code is different. Repeats: colours can appear more than once.',
    ],
    modes: [{ id: 'unique', label: 'No repeats' }, { id: 'repeats', label: 'Repeats' }],
    defaultMode: 'unique',
    scoreLabel: 'guesses',
    lowerIsBetter: true,
    score,

    start(api) {
      const el = api.el;
      const secret = api.mode === 'repeats'
        ? [...Array(SLOTS)].map(() => api.util.rand(COLOURS.length))
        : api.util.shuffle([...COLOURS.keys()]).slice(0, SLOTS);
      const history = [];
      let guess = [];
      let over = false;

      const peg = (v, size) => el('div', { text: v == null ? '' : LABELS[v], style: 'width:' + size + 'px;height:' + size + 'px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:' + Math.round(size * 0.42) + 'px;color:rgba(0,0,0,.55);'
        + (v == null ? 'border:2px dashed var(--line);background:transparent' : 'background:' + COLOURS[v] + ';box-shadow:inset 0 -3px 0 rgba(0,0,0,.18)') });

      const board = el('div', { style: 'display:grid;gap:6px;width:100%;max-width:360px;margin:0 auto' });
      const current = el('div', { style: 'display:flex;gap:10px;justify-content:center;padding:10px;border-radius:16px;background:var(--card);border:1px solid var(--line)' });
      const palette = el('div', { style: 'display:flex;gap:8px;justify-content:center;flex-wrap:wrap' });
      COLOURS.forEach((_, v) => {
        const b = el('button', { style: 'padding:0;border-radius:50%' }, peg(v, 44));
        b.addEventListener('click', () => { if (!over && guess.length < SLOTS) { guess.push(v); api.sfx('tap'); draw(); } });
        palette.append(b);
      });
      const submit = el('button', { class: 'btn', text: 'Guess', onclick: go });
      const controls = el('div', { class: 'row-btns', style: 'max-width:360px;width:100%;margin:0 auto' }, [
        el('button', { class: 'btn secondary', text: '⌫ Undo peg', onclick: () => { guess.pop(); draw(); } }),
        submit,
      ]);
      api.root.style.justifyContent = 'flex-start';
      api.onCleanup(() => { api.root.style.justifyContent = ''; });
      api.root.append(board, current, palette, controls);

      function feedback(f) {
        const box = el('div', { style: 'display:grid;grid-template-columns:repeat(2,12px);gap:3px' });
        for (let k = 0; k < SLOTS; k++) {
          const kind = k < f.black ? 'b' : k < f.black + f.white ? 'w' : '';
          box.append(el('div', { style: 'width:12px;height:12px;border-radius:50%;'
            + (kind === 'b' ? 'background:var(--text)' : kind === 'w' ? 'border:2px solid var(--text)' : 'background:var(--card-2)') }));
        }
        return box;
      }

      function draw() {
        board.innerHTML = '';
        history.forEach((h, k) => {
          board.append(el('div', { style: 'display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:12px;background:var(--bg-2);border:1px solid var(--line)' }, [
            el('div', { style: 'width:22px;color:var(--muted);font-size:13px;font-weight:700', text: k + 1 }),
            el('div', { style: 'display:flex;gap:8px;flex:1' }, h.guess.map((v) => peg(v, 30))),
            feedback(h.f),
          ]));
        });
        current.innerHTML = '';
        for (let k = 0; k < SLOTS; k++) {
          const slot = el('button', { style: 'padding:0;border-radius:50%' }, peg(guess[k], 46));
          slot.addEventListener('click', () => { if (guess[k] != null) { guess.splice(k, 1); draw(); } });
          current.append(slot);
        }
        submit.disabled = guess.length !== SLOTS || over;
        api.status('Guess ' + Math.min(history.length + 1, TRIES) + '/' + TRIES);
      }

      function go() {
        if (over || guess.length !== SLOTS) return;
        const f = score(secret, guess);
        history.push({ guess: guess.slice(), f });
        guess = [];
        if (f.black === SLOTS) {
          over = true; draw();
          api.finish({ score: history.length, detail: 'Cracked in ' + history.length + ' guess' + (history.length > 1 ? 'es' : '') });
          return;
        }
        api.sfx(f.black + f.white ? 'good' : 'bad');
        if (history.length >= TRIES) {
          over = true; draw();
          api.finish({ score: null, detail: 'Out of guesses – the code was ' + secret.map((v) => LABELS[v]).join(' ') });
          return;
        }
        draw();
        board.lastChild.scrollIntoView({ block: 'nearest' });
      }

      draw();
    },
  });
})();
