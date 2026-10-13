LB.register({
  id: 'word-scramble',
  name: 'Word Scramble',
  cat: 'words',
  icon: '🔀',
  blurb: 'Unjumble the letters',
  trains: ['Vocabulary', 'Verbal fluency'],
  howTo: [
    'Tap the letters in order to spell the hidden word.',
    'Tap a placed letter to send it back.',
    'Words get longer as you go. Skipping costs 5 seconds. 90 seconds in total.',
  ],
  scoreLabel: 'words solved',

  start(api) {
    const el = api.el, { pick, shuffle } = api.util;
    const WORDS = {
      4: 'BAKE BARN BEAR BIRD BOAT BOLD BOOK CAKE CALM CAVE CHIP CLAY COAT CORN CRAB DESK DIVE DOVE DRUM DUCK DUSK FARM FERN FISH FLAG FOAM FORK FROG GATE GIFT GOLD GOLF HARP HAWK HILL HOOK HORN JAZZ KITE LAMB LAMP LEAF LIME LION MILK MINT MOON MOTH NEST OVEN PARK PEAR PINE PLUM POND RAIN ROAD ROCK ROOF SAND SHIP SNOW SOCK SOUP STAR SWAN TENT TIDE TOAD TREE TUNE VASE WAVE WIND WOLF WOOL YARN ZERO',
      5: 'APPLE BEACH BENCH BLOOM BRAIN BREAD BRICK BRUSH CABIN CANDY CHAIR CHALK CHESS CLOCK CLOUD COAST CRANE CROWN DAISY DREAM EAGLE FEAST FENCE FLAME FLUTE FROST GHOST GLOBE GRAPE GRASS HEART HONEY HORSE HOUSE JELLY JUICE KNIFE LEMON LIGHT MAPLE MARCH MOUSE MUSIC NIGHT NOVEL OCEAN OLIVE ONION OTTER PAINT PEARL PIANO PIZZA PLANT PLATE QUEEN QUIET RIVER ROBIN SALAD SCARF SHEEP SHELL SMILE SNAIL SPOON STORM SUGAR TABLE TIGER TOAST TOWEL TRAIN TRUCK WATER WHALE WHEAT ZEBRA',
      6: 'ANCHOR BASKET BRIDGE BUTTER CACTUS CAMERA CANDLE CARROT CASTLE CHERRY CIRCUS COFFEE COOKIE DONKEY DRAGON FALCON FLOWER FOREST GARDEN GINGER GUITAR HAMMER HELMET ISLAND JACKET JUNGLE KETTLE KITTEN LADDER LIZARD MAGNET MARKET MEADOW MIRROR MONKEY MUFFIN NAPKIN ORANGE OYSTER PALACE PARROT PENCIL PEPPER PICNIC PLANET POCKET POTATO PUZZLE RABBIT RIBBON ROCKET SADDLE SALMON SCHOOL SHADOW SILVER SPIDER SPRING SQUARE STREAM SUMMER TEAPOT TICKET TOMATO TUNNEL TURKEY TURTLE VALLEY VELVET WALNUT WINDOW WINTER WIZARD',
      7: 'ACROBAT BALLOON BICYCLE BISCUIT BLANKET CAPTAIN CARAVAN CHICKEN COMPASS CRYSTAL CUSHION DOLPHIN ELEPHANT FIREFLY GIRAFFE HARVEST HEDGEHOG KITCHEN LANTERN LIBRARY MACHINE MAGICAL MESSAGE MORNING MUSHROOM OCTOPUS ORCHARD PANCAKE PENGUIN PICTURE PILGRIM PUMPKIN RAINBOW SANDWICH SEAWEED SHELTER SPARROW SUNRISE TEACHER THUNDER TRUMPET UNIFORM VOLCANO WARDROBE WEATHER',
    };
    const lists = {};
    Object.keys(WORDS).forEach((k) => { lists[k] = WORDS[k].split(' ').filter((w) => w.length === Number(k)); });
    const all = new Set(Object.values(lists).flat());

    let solved = 0, skipped = 0, word, letters, placed, over = false, busy = false;
    const used = new Set();

    const prompt = el('div', { class: 'prompt' });
    const slots = el('div', { class: 'letter-row' });
    const pool = el('div', { class: 'letter-row' });
    const controls = el('div', { class: 'row-btns' }, [
      el('button', { class: 'btn secondary', text: 'Shuffle', onclick: () => { if (!over && !busy) { letters = shuffle(letters); draw(); } } }),
      el('button', { class: 'btn secondary', text: 'Clear', onclick: () => { placed = []; draw(); } }),
      el('button', { class: 'btn secondary', text: 'Skip', onclick: skip }),
    ]);
    api.root.append(prompt, slots, pool, controls);

    function next() {
      const len = Math.min(7, 4 + Math.floor(solved / 3));
      do { word = pick(lists[len]); } while (used.has(word) && used.size < all.size);
      used.add(word);
      letters = word.split('').map((ch, i) => ({ ch, id: i }));
      do { letters = shuffle(letters); } while (letters.map((l) => l.ch).join('') === word);
      placed = [];
      busy = false;
      prompt.textContent = len + '-letter word';
      draw();
    }

    function draw() {
      slots.innerHTML = '';
      pool.innerHTML = '';
      for (let i = 0; i < word.length; i++) {
        const p = placed[i];
        const s = el('button', { class: 'letter' + (p ? '' : ' slot'), text: p ? p.ch : '' });
        if (p) s.addEventListener('click', () => { placed.splice(i, 1); api.sfx('tap'); draw(); });
        slots.append(s);
      }
      letters.forEach((l) => {
        const isUsed = placed.includes(l);
        const b = el('button', { class: 'letter' + (isUsed ? ' used' : ''), text: l.ch });
        b.addEventListener('click', () => { if (over || busy) return; placed.push(l); api.sfx('tap'); draw(); check(); });
        pool.append(b);
      });
    }

    function check() {
      if (placed.length !== word.length) return;
      const guess = placed.map((p) => p.ch).join('');
      if (guess === word || all.has(guess)) {
        solved++;
        busy = true;
        api.sfx('good');
        api.util.flash(slots, true);
        api.status('✓ ' + solved);
        api.after(next, 350);
      } else {
        api.sfx('bad'); api.buzz(80); api.util.flash(slots, false);
        api.after(() => { placed = []; draw(); }, 400);
      }
    }

    function skip() {
      if (over || busy) return;
      busy = true;
      skipped++;
      timer.add(-5);
      prompt.textContent = 'It was ' + word;
      api.sfx('bad');
      api.after(next, 900);
    }

    api.status('✓ 0');
    next();
    const timer = api.countdown(90, () => {
      over = true;
      api.finish({ score: solved, detail: 'Last word: ' + word + (skipped ? ' · ' + skipped + ' skipped' : '') });
    });
  },
});
