(function () {
  'use strict';

  // Each ladder: top word, five middle words, bottom word. Each word differs from the
  // next by exactly one letter, and the middle five only link up in one order.
  const LADDERS = [
    [
      'COLD|Opposite of hot',
      'CORD|Thin rope or string',
      'CARD|Sent on a birthday',
      'WARD|Hospital room shared by patients',
      'WARM|Comfortably hot',
      'WORM|The early bird catches it',
      'WORD|You are reading one right now',
    ],
    [
      'LAMP|Bedside light',
      'LAMB|Young sheep',
      'LIMB|An arm or a leg',
      'LIMP|Walk unevenly after an injury',
      'LISP|Speech habit that turns “s” into “th”',
      'LIST|Shopping reminder on paper',
      'MIST|Light fog',
    ],
    [
      'BOAT|Rowing ___',
      'COAT|Worn over a jumper in winter',
      'COST|Price',
      'CAST|Actors in a play',
      "CASE|A detective's investigation",
      'CAVE|Underground home for bats',
      'GAVE|Handed over as a present',
    ],
    [
      'FISH|Battered and served with chips',
      'DISH|Plate or bowl',
      'DASH|Sprint, or a punctuation mark',
      'CASH|Notes and coins',
      'CASK|Barrel for ale',
      'MASK|Worn at a masquerade ball',
      "MAST|Pole that holds a ship's sails",
    ],
    [
      'RAIN|A British weather staple',
      'RAIL|Train track',
      'MAIL|Post',
      'MALL|Indoor shopping centre',
      "BALL|Cinderella's big night out",
      'BELL|Rung at the end of the school day',
      'BELT|Holds your trousers up',
    ],
    [
      "HOME|There's no place like it",
      'HOLE|A golf course has 18 of these',
      'POLE|North or South ___',
      'PILE|Heap',
      'PINE|Type of Christmas tree',
      'WINE|Red, white or rosé',
      'WIND|It blows a gale',
    ],
    [
      'TEAM|Eleven players together',
      'TEAR|Drop from a crying eye',
      'BEAR|Paddington, for one',
      'BEAD|Threaded on a necklace',
      'HEAD|Top of the body',
      'HEAL|Get better, as a wound does',
      'HEEL|Back of the foot',
    ],
    [
      'GOLD|First-place medal',
      'GOLF|Sport with tees and greens',
      'WOLF|Howls at the moon',
      "WOOF|A dog's bark",
      "HOOF|A horse's foot",
      "HOOD|Robin's surname",
      'FOOD|What a lunch break is for',
    ],
    [
      'SHIP|Ocean liner',
      'SHOP|Corner ___',
      'SHOT|Attempt at goal',
      'SLOT|Where a coin goes in a machine',
      'SLAT|Strip of a wooden blind',
      'FLAT|Apartment',
      'FLAG|The Union Jack, for one',
    ],
    [
      'CAKE|Victoria sponge',
      'LAKE|Windermere is one',
      'LANE|Narrow country road',
      'LINE|Queue',
      'LIME|Green citrus fruit',
      'TIME|What a clock tells you',
      'TIDE|Comes in and goes out at the beach',
    ],
    [
      'DOVE|Bird of peace',
      'LOVE|Zero, in tennis',
      'LOSE|Opposite of win',
      "ROSE|England's national flower",
      'RISE|Get up, as bread dough does',
      'RICE|Served with curry',
      'MICE|Three blind ones',
    ],
    [
      'TREE|Oak or ash',
      'FREE|Costing nothing',
      'FRET|Worry',
      'FEET|Things you stand on',
      'FEEL|Touch',
      'PEEL|Orange skin',
      'PEER|Member of the House of Lords',
    ],
    [
      'BOOK|Read one at bedtime',
      'LOOK|Glance',
      'LOOM|Weaving machine',
      'ROOM|Kitchen or lounge',
      'ROAM|Wander freely',
      'FOAM|Froth on a cappuccino',
      'FOAL|Baby horse',
    ],
    [
      'PARK|Hyde ___',
      'PART|Role in a play',
      'CART|Horse-drawn wagon',
      'CARE|Look after (___ for)',
      "CORE|An apple's centre",
      'CORN|Popcorn starts as this',
      "HORN|A car's hooter",
    ],
    [
      'SEAL|Animal that barks, or wax stamp on a letter',
      'SEAT|Chair',
      'SPAT|Minor quarrel',
      'SPIT|Rotating rod for roasting meat',
      'SPIN|Twirl',
      "SKIN|The body's largest organ",
      'SKIP|Big rubbish container on a building site',
    ],
    [
      'HAND|Has five fingers',
      'LAND|Touch down, as a plane does',
      'LEND|Let someone borrow',
      "LEAD|A dog's walking strap",
      'LOAD|A washing-machine batch',
      'TOAD|Mr ___ of Toad Hall',
      'TOLD|Informed',
    ],
    [
      'KING|Chess piece',
      'RING|Worn on a finger',
      'RANG|Phoned',
      'RANT|Angry tirade',
      'PANT|Breathe hard after a run',
      'PINT|Pub measure',
      'MINT|A Polo, for one',
    ],
    [
      'BIRD|Robin or wren',
      "BARD|Shakespeare's nickname",
      'BARN|Farm building for hay',
      'BURN|Kitchen injury from the oven',
      'TURN|Your go in a board game',
      'TERN|Seabird',
      'TEEN|Aged 13 to 19',
    ],
    [
      'DUCK|Quack!',
      'DOCK|Where ships unload',
      'SOCK|Often lost in the wash',
      'SICK|Unwell',
      'SILK|Smooth fabric made by worms',
      'SILT|Mud left by a river',
      'WILT|Droop, like an unwatered plant',
    ],
    [
      'WOOD|Timber',
      "WOOL|A sheep's coat, knitted into jumpers",
      'COOL|Chilly, or calm and collected',
      'COAL|Fuel once dug from Welsh mines',
      'GOAL|What every striker wants to score',
      'GOAT|Farm animal with a beard',
      'MOAT|Water-filled ditch round a castle',
    ],
  ].map((l) => l.map((s) => { const [word, clue] = s.split('|'); return { word, clue }; }));

  const oneApart = (a, b) => [...a].filter((ch, i) => ch !== b[i]).length === 1;

  LB.register({
    id: 'word-climb',
    name: 'Word Climb',
    cat: 'words',
    icon: '🪜',
    blurb: 'Solve the clues, then build the ladder',
    trains: ['Vocabulary', 'General knowledge', 'Sequencing'],
    howTo: [
      'Solve the five clues – every answer is a four-letter word.',
      'Then use ▲ ▼ to put them in order so each word changes just one letter from the next.',
      'That unlocks the top and bottom rungs. Solve them to finish.',
      'Hints reveal a letter but add 10 seconds. Fastest time wins.',
    ],
    scoreLabel: 'time',
    lowerIsBetter: true,
    formatScore: (s) => LB.util.fmtTime(s),
    ladders: LADDERS,
    oneApart,

    start(api) {
      const el = api.el;

      // Pick a ladder you haven't seen recently.
      const st = LB.state.games['word-climb'] || (LB.state.games['word-climb'] = { plays: 0, best: {}, time: 0, history: [] });
      const seen = st.seen || [];
      const fresh = LADDERS.map((_, i) => i).filter((i) => !seen.includes(i));
      const idx = api.util.pick(fresh.length ? fresh : LADDERS.map((_, i) => i));
      st.seen = seen.concat(idx).slice(-(LADDERS.length - 1));
      LB.save();

      const lad = LADDERS[idx];
      const top = { ...lad[0], entry: '', solved: false, end: true };
      const bottom = { ...lad[6], entry: '', solved: false, end: true };
      let middle;
      // Shuffle the middle rungs, making sure they don't already form the ladder (either way up).
      const answer = lad.slice(1, 6).map((m) => m.word).join();
      const reversed = lad.slice(1, 6).map((m) => m.word).reverse().join();
      do { middle = api.util.shuffle(lad.slice(1, 6)); } while ([answer, reversed].includes(middle.map((m) => m.word).join()));
      middle = middle.map((m) => ({ ...m, entry: '', solved: false }));

      let phase = 'solve', selected = middle[0], penalty = 0, hints = 0;

      const prompt = el('div', { class: 'prompt', style: 'flex:1;text-align:left;font-size:14px;line-height:1.3' });
      const hintBtn = el('button', { class: 'btn secondary', style: 'padding:8px 12px;font-size:13px;flex:none', text: '💡 Hint +10s', onclick: hint });
      const list = el('div', { 'data-rungs': '', style: 'display:grid;gap:6px;width:100%' });
      // Keyboard sticks to the bottom so it is always reachable on short screens.
      const kb = el('div', { style: 'display:grid;gap:6px;width:100%;position:sticky;bottom:0;padding:8px 0 4px;background:var(--bg)' });
      api.root.style.justifyContent = 'flex-start';
      api.root.style.gap = '10px';
      api.onCleanup(() => { api.root.style.justifyContent = ''; api.root.style.gap = ''; });
      api.root.append(el('div', { style: 'display:flex;align-items:center;gap:10px;width:100%' }, [prompt, hintBtn]), list, kb);

      ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM⌫'].forEach((row) => {
        const r = el('div', { style: 'display:flex;gap:5px;justify-content:center' });
        [...row].forEach((k) => {
          const b = el('button', { text: k, style: 'flex:1;max-width:' + (k === '⌫' ? 56 : 38) + 'px;padding:11px 0;border-radius:8px;background:var(--card);border:1px solid var(--line);font-weight:700;font-size:16px' });
          b.addEventListener('click', () => key(k));
          r.append(b);
        });
        kb.append(r);
      });

      function onKey(e) {
        if (/^[a-z]$/i.test(e.key)) key(e.key.toUpperCase());
        else if (e.key === 'Backspace') key('⌫');
      }
      document.addEventListener('keydown', onKey);
      api.onCleanup(() => document.removeEventListener('keydown', onKey));

      function rowEl(item, opts) {
        const locked = item.end && phase !== 'ends';
        const isSel = item === selected && !item.solved && !locked;
        const boxes = el('div', { style: 'display:flex;gap:4px;flex:none' });
        for (let k = 0; k < 4; k++) {
          const ch = item.solved ? item.word[k] : item.entry[k] || '';
          boxes.append(el('div', { text: locked ? '' : ch, style: 'width:34px;height:36px;border-radius:7px;display:grid;place-items:center;font-weight:800;font-size:18px;'
            + 'background:' + (item.solved ? 'var(--words)' : locked ? 'var(--card-2)' : 'var(--card)') + ';'
            + 'color:' + (item.solved ? '#05301d' : 'var(--text)') + ';'
            + 'border:2px solid ' + (isSel ? 'var(--accent)' : 'var(--line)') }));
        }
        const clue = el('div', { style: 'flex:1;min-width:0;font-size:13px;line-height:1.25;color:' + (locked ? 'var(--muted)' : 'var(--text)'),
          text: locked ? '🔒 Unlocks when the ladder is in order' : item.clue });
        const row = el('div', { style: 'display:flex;align-items:center;gap:10px;padding:4px 8px;min-height:46px;border-radius:12px;background:' + (item.end ? 'transparent' : 'var(--bg-2)') + ';border:1px solid var(--line)' }, [boxes, clue]);
        if (opts && opts.move) {
          const btn = (t, d) => el('button', { text: t, style: 'width:32px;height:30px;border-radius:8px;background:var(--card-2);font-size:13px', onclick: (e) => { e.stopPropagation(); move(opts.i, d); } });
          row.append(el('div', { style: 'display:flex;flex-direction:row;gap:4px' }, [btn('▲', -1), btn('▼', 1)]));
        }
        row.addEventListener('click', () => { if (!locked && !item.solved) { selected = item; api.sfx('tap'); draw(); } });
        return row;
      }

      function draw() {
        list.innerHTML = '';
        list.append(rowEl(top));
        middle.forEach((m, i) => list.append(rowEl(m, phase === 'order' ? { move: true, i } : null)));
        list.append(rowEl(bottom));
        const msgs = {
          solve: 'Solve the clues – tap a row to choose it',
          order: 'Now order them: each word changes one letter from the next',
          locked: 'Ladder complete! ✓',
          ends: 'Top and bottom unlocked – finish the climb!',
        };
        prompt.textContent = msgs[phase];
        hintBtn.disabled = phase === 'order';
        kb.style.opacity = phase === 'order' ? '.35' : '1';
        api.status(['💡 ' + hints]);
      }

      function key(k) {
        if (phase === 'order' || !selected || selected.solved) return;
        if (k === '⌫') { selected.entry = selected.entry.slice(0, -1); draw(); return; }
        if (selected.entry.length >= 4) return;
        api.sfx('tap');
        selected.entry += k;
        if (selected.entry.length === 4) {
          if (selected.entry === selected.word) { solveRow(selected); return; }
          api.sfx('bad'); api.buzz(80);
          draw(); api.util.flash(list, false);
          const s = selected;
          api.after(() => { s.entry = ''; draw(); }, 450);
          return;
        }
        draw();
      }

      function solveRow(item) {
        item.solved = true;
        api.sfx('good');
        const pool = phase === 'ends' ? [top, bottom] : middle;
        selected = pool.find((m) => !m.solved) || null;
        if (phase === 'solve' && !selected) {
          phase = 'order';
          if (isLadder()) { api.after(unlock, 600); }
        } else if (phase === 'ends' && !selected) {
          draw();
          const t = Math.round(clock.stop() + penalty);
          api.finish({ score: t, detail: lad.map((w) => w.word).join(' → ') + (hints ? '<br>' + hints + ' hint' + (hints > 1 ? 's' : '') + ' (+' + penalty + 's)' : '') });
          return;
        }
        draw();
      }

      function hint() {
        if (!selected || selected.solved || phase === 'order') return;
        // Keep the correct prefix, then reveal the next letter.
        let k = 0;
        while (k < selected.entry.length && selected.entry[k] === selected.word[k]) k++;
        selected.entry = selected.word.slice(0, k + 1);
        hints++; penalty += 10;
        api.sfx('tap');
        if (selected.entry.length === 4) solveRow(selected); else draw();
      }

      function isLadder() {
        return middle.every((m, i) => i === 0 || oneApart(middle[i - 1].word, m.word));
      }

      function move(i, d) {
        const j = i + d;
        if (j < 0 || j >= middle.length) return;
        [middle[i], middle[j]] = [middle[j], middle[i]];
        api.sfx('tap');
        if (isLadder()) { phase = 'locked'; api.after(unlock, 600); }
        draw();
      }

      function unlock() {
        // The ladder may be upside down – flip it so it joins the top and bottom words.
        if (!oneApart(top.word, middle[0].word)) middle.reverse();
        phase = 'ends';
        api.sfx('win');
        selected = top;
        draw();
      }

      const clock = api.stopwatch();
      draw();
    },
  });
})();
