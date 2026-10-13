LB.register({
  id: 'colour-clash',
  name: 'Colour Clash',
  cat: 'focus',
  icon: '🎨',
  blurb: 'Ignore the word, name the ink',
  trains: ['Inhibition', 'Selective attention'],
  howTo: [
    'A colour word appears, printed in a coloured ink.',
    'Tap the button for the INK colour – not what the word says.',
    'Correct answers score a point; wrong ones lose a point. 45 seconds.',
  ],
  scoreLabel: 'points',

  start(api) {
    const el = api.el, { pick, shuffle } = api.util;
    const COLOURS = [
      { name: 'RED', css: '#ff4d5e' },
      { name: 'BLUE', css: '#3b8cff' },
      { name: 'GREEN', css: '#27c46b' },
      { name: 'YELLOW', css: '#ffc928' },
    ];
    let score = 0, right = 0, wrong = 0, ink, over = false;

    const word = el('div', { class: 'big', style: 'font-size:64px;padding:30px 0;background:var(--card);border-radius:24px;border:1px solid var(--line)' });
    const prompt = el('div', { class: 'prompt', text: 'What colour is the INK?' });
    const row = el('div', { class: 'choice-row' });
    api.root.append(prompt, word, row);

    function next() {
      const w = pick(COLOURS);
      ink = Math.random() < 0.25 ? w : pick(COLOURS.filter((c) => c !== w));
      word.textContent = w.name;
      word.style.color = ink.css;
      // Buttons: text labels, reshuffled, written in neutral colour to keep it fair
      row.innerHTML = '';
      shuffle(COLOURS).forEach((c) => {
        const b = el('button', { text: c.name.charAt(0) + c.name.slice(1).toLowerCase(), style: 'background:var(--card-2);color:var(--text);border:1px solid var(--line)' });
        b.addEventListener('click', () => answer(c, b));
        row.append(b);
      });
    }

    function answer(c, b) {
      if (over) return;
      if (c === ink) { score++; right++; api.sfx('good'); }
      else { score = Math.max(0, score - 1); wrong++; api.sfx('bad'); api.buzz(80); api.util.flash(word, false); b.style.background = 'var(--bad)'; }
      api.status('Score ' + score);
      next();
    }

    api.status('Score 0');
    next();
    api.countdown(45, () => {
      over = true;
      const acc = right + wrong ? Math.round((right / (right + wrong)) * 100) : 0;
      api.finish({ score, detail: right + ' right · ' + wrong + ' wrong · ' + acc + '% accuracy' });
    });
  },
});
