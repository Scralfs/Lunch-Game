# 🍱 Lunchbox – Brain Games

Bite-sized brain training for your lunch break. Installable on your phone and works fully offline.
No build step, no frameworks, no tracking – your scores are saved only on your device.

## Games (17)

| Skill | Game | What it is |
|---|---|---|
| 🧠 Memory | **Sequence** | Repeat the glowing pattern (*Classic 3×3* = the original Lunch Brain game, or *Trail 4×4*) |
| 🧠 Memory | **Pair Up** | Find the matching pairs |
| 🧠 Memory | **Chimp Test** | Remember where the numbers were, then tap them in order |
| 🧠 Memory | **N-Back** | The classic working-memory workout (1-, 2- or 3-back) |
| ➗ Maths | **Make 24** | Use all four numbers to make 24 (from the original Lunch Brain) – Sprint or Relaxed |
| ➗ Maths | **Numbers Round** | Countdown-style: hit a 3-digit target with six numbers |
| ➗ Maths | **Quick Maths** | 60 seconds of mental arithmetic that gets harder as you go |
| 🎯 Focus | **Colour Clash** | Stroop test – name the ink, not the word |
| 🎯 Focus | **Number Hunt** | Find 1–25 in a scrambled grid as fast as you can |
| 🎯 Focus | **Odd One Out** | Spot the slightly different shade |
| 🔤 Words | **Word Scramble** | Unjumble the letters |
| 🔤 Words | **Missing Vowels** | Only Connect-style: rebuild answers with the vowels removed |
| 🔤 Words | **Word Climb** | Solve clues for four-letter words, order them into a word ladder, then unlock the top and bottom rungs |
| 🧩 Logic | **Sudoku** | Freshly generated 9×9 puzzles (Easy / Medium / Hard) with notes |
| 🧩 Logic | **Crowns** | One crown per row, column and coloured region, none touching (6×6 / 7×7 / 8×8, always one solution) |
| 🧩 Logic | **Sun & Moon** | Balance suns and moons with = and × clues (Easy / Hard, always one solution) |
| ⚡ Speed | **Reflex** | Reaction-time test |

Platform features: daily "lunch menu" of three games (starter, main, pudding), day streak and weekly tracker,
personal bests per game and mode, stats with a 7-day chart and "brain balance", light/dark theme, sound and vibration toggles.

## Getting it on your phone

The app needs to be served over HTTPS once so your phone can install it; after that it runs offline.

**Easiest: GitHub Pages**
1. In the GitHub repo go to **Settings → Pages**.
2. Under *Build and deployment*, choose **Deploy from a branch**, pick your branch and the `/ (root)` folder, then **Save**.
3. Open the URL GitHub gives you on your phone.
   - **iPhone (Safari):** Share → **Add to Home Screen**.
   - **Android (Chrome):** ⋮ menu → **Install app** / **Add to Home screen**.
4. Open it once from the home-screen icon while online. From then on it works with no signal.

(GitHub Pages on a private repo needs a paid GitHub plan. Netlify Drop or Vercel are free alternatives – just upload the folder.)

**Updates:** new versions are picked up in the background next time you open the app with a connection.

## Running locally

```sh
npx http-server -c-1 .
```
Then open http://localhost:8080. (Opening `index.html` directly works too, just without offline caching.)

## Adding a game

Create `js/games/your-game.js` calling `LB.register({...})` (copy any existing game as a template), add a `<script>` tag
in `index.html`, add the file to the list in `sw.js` and bump `VERSION` there.

`original-lunch-brain.html` is the first version this grew out of, kept for reference.
