LB.register({
  id: 'missing-vowels',
  name: 'Missing Vowels',
  cat: 'words',
  icon: '🅰️',
  blurb: 'Rebuild words with the vowels removed',
  trains: ['Verbal fluency', 'Pattern recognition', 'General knowledge'],
  howTo: [
    'You get a category and some consonants, e.g. “Animals: HD GHG”.',
    'The vowels have been removed and the spaces moved around.',
    'Type the full answer and press Enter. Pass if you are stuck. 90 seconds.',
  ],
  scoreLabel: 'answers',

  start(api) {
    const el = api.el, { shuffle, between } = api.util;
    const BANK = {
      'UK cities': 'MANCHESTER BIRMINGHAM LIVERPOOL EDINBURGH GLASGOW CARDIFF BELFAST BRISTOL SHEFFIELD NOTTINGHAM LEICESTER NEWCASTLE BRIGHTON OXFORD CAMBRIDGE PLYMOUTH ABERDEEN SOUTHAMPTON PORTSMOUTH NORWICH EXETER SWANSEA DUNDEE COVENTRY INVERNESS CANTERBURY',
      'Animals': 'ELEPHANT GIRAFFE KANGAROO HEDGEHOG BADGER SQUIRREL OCTOPUS PENGUIN DOLPHIN CROCODILE GORILLA CHEETAH FLAMINGO ARMADILLO PORCUPINE ALLIGATOR ANTEATER OSTRICH BUFFALO CATERPILLAR PELICAN MEERKAT WALRUS TORTOISE',
      'Countries': 'AUSTRALIA ARGENTINA PORTUGAL NEW_ZEALAND SOUTH_AFRICA ICELAND NORWAY GERMANY INDONESIA NIGERIA MOROCCO CANADA MEXICO BRAZIL IRELAND SWITZERLAND BELGIUM NETHERLANDS DENMARK FINLAND GREECE VIETNAM MALAYSIA COLOMBIA',
      'British food': 'FISH_AND_CHIPS SHEPHERDS_PIE ROAST_BEEF APPLE_CRUMBLE BEANS_ON_TOAST TOAD_IN_THE_HOLE SCOTCH_EGG CORNISH_PASTY YORKSHIRE_PUDDING STICKY_TOFFEE_PUDDING BANGERS_AND_MASH ETON_MESS VICTORIA_SPONGE PORRIDGE CHEESE_ON_TOAST BACON_SANDWICH CRUMPETS TREACLE_TART',
      'Sports': 'FOOTBALL CRICKET RUGBY_UNION TENNIS BADMINTON SNOOKER DARTS NETBALL HOCKEY CYCLING ROWING SWIMMING ATHLETICS BOXING VOLLEYBALL BASKETBALL TABLE_TENNIS GYMNASTICS ARCHERY SKIING',
      'Jobs': 'TEACHER ELECTRICIAN PLUMBER ACCOUNTANT ARCHITECT SOLICITOR NURSE FIREFIGHTER LIBRARIAN PHARMACIST CARPENTER JOURNALIST PHOTOGRAPHER DENTIST BUTCHER POSTMAN ENGINEER MECHANIC OPTICIAN HAIRDRESSER',
    };
    const strip = (s) => s.replace(/[AEIOU_ ]/g, '');
    const items = [];
    Object.entries(BANK).forEach(([cat, list]) => list.split(' ').forEach((w) => {
      const answer = w.replace(/_/g, ' ');
      if (strip(answer).length >= 3) items.push({ cat, answer });
    }));
    const deck = shuffle(items);
    let idx = -1, solved = 0, passed = 0, over = false, busy = false;

    function clue(answer) {
      const letters = strip(answer);
      const parts = [];
      let i = 0;
      while (i < letters.length) {
        const n = Math.min(letters.length - i, between(2, 4));
        parts.push(letters.slice(i, i + n));
        i += n;
      }
      return parts.join(' ');
    }
    const norm = (s) => s.toUpperCase().replace(/[^A-Z]/g, '');

    const cat = el('div', { class: 'prompt', style: 'font-size:16px;font-weight:700;color:var(--words)' });
    const clueEl = el('div', { class: 'big', style: 'font-size:36px;letter-spacing:.08em;word-spacing:.3em' });
    const input = el('input', { class: 'text-input', autocomplete: 'off', autocorrect: 'off', autocapitalize: 'characters', spellcheck: 'false', enterkeyhint: 'go', placeholder: 'Your answer' });
    const msg = el('div', { class: 'prompt' });
    const controls = el('div', { class: 'row-btns' }, [
      el('button', { class: 'btn secondary', text: 'Pass', onclick: pass }),
      el('button', { class: 'btn', text: 'Submit', onclick: submit }),
    ]);
    api.root.style.justifyContent = 'flex-start';
    api.onCleanup(() => { api.root.style.justifyContent = ''; });
    api.root.append(cat, clueEl, input, msg, controls);

    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
    input.addEventListener('input', () => {
      if (!over && !busy && norm(input.value) === norm(deck[idx].answer)) submit();
    });

    function next() {
      idx = (idx + 1) % deck.length;
      busy = false;
      const it = deck[idx];
      cat.textContent = it.cat;
      clueEl.textContent = clue(it.answer);
      input.value = '';
      msg.textContent = '';
      input.focus();
    }

    function submit() {
      if (over || busy) return;
      const it = deck[idx];
      if (norm(input.value) === norm(it.answer)) {
        busy = true;
        solved++;
        api.sfx('good'); api.util.flash(input, true);
        api.status('✓ ' + solved);
        msg.textContent = '✓ ' + it.answer;
        api.after(next, 500);
      } else if (input.value.trim()) {
        api.sfx('bad'); api.buzz(80); api.util.flash(input, false);
        msg.textContent = 'Not quite – keep trying or pass';
      }
    }

    function pass() {
      if (over || busy) return;
      busy = true;
      passed++;
      api.sfx('bad');
      msg.textContent = 'It was: ' + deck[idx].answer;
      api.after(next, 1200);
    }

    api.status('✓ 0');
    next();
    api.countdown(90, () => {
      over = true;
      input.blur();
      api.finish({ score: solved, detail: solved + ' solved · ' + passed + ' passed' });
    });
  },
});
