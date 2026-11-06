(function () {
  'use strict';

  // Shapes are random polyominoes (blocks joined edge to edge). Only shapes whose mirror
  // image can't be made by rotating are used, so "same" and "mirror" are never both right.
  const key = (cells) => cells.map(([x, y]) => x + ',' + y).sort().join(' ');
  const normalise = (cells) => {
    const mx = Math.min(...cells.map((c) => c[0])), my = Math.min(...cells.map((c) => c[1]));
    return cells.map(([x, y]) => [x - mx, y - my]);
  };
  const rotate = (cells) => normalise(cells.map(([x, y]) => [-y, x]));
  const mirror = (cells) => normalise(cells.map(([x, y]) => [-x, y]));

  function chiral(cells) {
    const m = key(mirror(cells));
    let r = cells;
    for (let k = 0; k < 4; k++) { if (key(r) === m) return false; r = rotate(r); }
    return true;
  }

  function makeShape(size, rng) {
    for (;;) {
      const cells = [[0, 0]];
      const has = (x, y) => cells.some((c) => c[0] === x && c[1] === y);
      while (cells.length < size) {
        const [x, y] = cells[Math.floor(rng() * cells.length)];
        const [dx, dy] = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(rng() * 4)];
        if (!has(x + dx, y + dy)) cells.push([x + dx, y + dy]);
      }
      const shape = normalise(cells);
      if (chiral(shape)) return shape;
    }
  }

  LB.register({
    id: 'spin-match',
    name: 'Spin Match',
    cat: 'focus',
    icon: '🔄',
    blurb: 'Same shape turned round, or a mirror image?',
    trains: ['Mental rotation', 'Spatial reasoning'],
    howTo: [
      'Two shapes appear. The right one has been turned round – and may also have been flipped.',
      'Tap SAME if turning it would make it match, or MIRROR if it has been flipped over.',
      'Shapes get bigger and the angles trickier as you go. Right +1, wrong −1. 60 seconds.',
    ],
    scoreLabel: 'points',
    chiral,
    makeShape,

    start(api) {
      const el = api.el;
      let score = 0, right = 0, wrong = 0, answerIsMirror = false, over = false;

      const prompt = el('div', { class: 'prompt', text: 'Same shape, or a mirror image?' });
      const pair = el('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:12px' });
      const row = el('div', { class: 'choice-row' });
      const sameBtn = el('button', { text: '↻ Same', style: 'background:var(--focus)' });
      const mirrorBtn = el('button', { text: '⇋ Mirror', style: 'background:var(--memory)' });
      sameBtn.addEventListener('click', () => answer(false));
      mirrorBtn.addEventListener('click', () => answer(true));
      row.append(sameBtn, mirrorBtn);
      api.root.append(prompt, pair, row);

      function svg(cells, angle, flip) {
        const S = 20;
        const w = Math.max(...cells.map((c) => c[0])) + 1, h = Math.max(...cells.map((c) => c[1])) + 1;
        const cx = (w * S) / 2, cy = (h * S) / 2;
        const rects = cells.map(([x, y]) => '<rect x="' + (x * S + 1) + '" y="' + (y * S + 1) + '" width="' + (S - 2) + '" height="' + (S - 2) + '" rx="3"/>').join('');
        const t = 'translate(60 60) rotate(' + angle + ') scale(' + (flip ? -1 : 1) + ' 1) translate(' + -cx + ' ' + -cy + ')';
        return '<svg viewBox="0 0 120 120" width="100%" style="display:block"><g transform="' + t + '" style="fill:var(--maths);stroke:var(--text);stroke-width:1.5">' + rects + '</g></svg>';
      }

      function next() {
        const size = Math.min(8, 5 + Math.floor(right / 4));
        const shape = makeShape(size, Math.random);
        const step = right < 6 ? 90 : 45;
        const a1 = step * api.util.rand(360 / step);
        let a2;
        do { a2 = step * api.util.rand(360 / step); } while (a2 === a1);
        answerIsMirror = Math.random() < 0.5;
        pair.innerHTML = '';
        pair.append(
          el('div', { class: 'card', style: 'padding:8px', html: svg(shape, a1, false) }),
          el('div', { class: 'card', style: 'padding:8px', html: svg(shape, a2, answerIsMirror) }),
        );
      }

      function answer(saidMirror) {
        if (over) return;
        if (saidMirror === answerIsMirror) { score++; right++; api.sfx('good'); }
        else { score = Math.max(0, score - 1); wrong++; api.sfx('bad'); api.buzz(80); api.util.flash(pair, false); }
        api.status('Score ' + score);
        next();
      }

      api.status('Score 0');
      next();
      api.countdown(60, () => {
        over = true;
        const acc = right + wrong ? Math.round((right / (right + wrong)) * 100) : 0;
        api.finish({ score, detail: right + ' right · ' + wrong + ' wrong · ' + acc + '% accuracy' });
      });
    },
  });
})();
