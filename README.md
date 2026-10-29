# Coin Dash — Lab 3 starter

Collect coins, avoid drones, and survive a 45-second round. Move with arrow keys or WASD;
press P to pause or resume; press R to restart. This is deliberately small so you can add features during the lab.

**Play our version:** https://shiralevy7.github.io/coin-dash-shiralevy-itailivne/ (served by GitHub Pages
from `main`). The original starter game without our features is at https://www.avivz.net/coin-dash/.

## Controls

- Arrow keys or WASD: move.
- P: pause or resume. The game shows a PAUSED overlay, and the round timer stops while paused.
- R: restart the round (also works while paused).

## High score

Your best score is shown in the top bar ("Best") and on the end-of-round panel. It is saved in the
browser's `localStorage` (key `coinDash.highScore`) as soon as you beat it, so it survives restarts and
page reloads. It is stored per browser, so a different browser or device starts from 0. If the browser
blocks storage (for example in private browsing), the game still runs but the best score is not kept.
To reset it, run `localStorage.removeItem('coinDash.highScore')` in the browser console.

## Power-ups

Two pickups appear on the board, each every 4 to 6 seconds, and stay for 6 seconds if you do not
grab them. Once picked up, a power-up lasts 5 seconds and blinks during its last second.

- **Shield** (blue star): a blue ring around you absorbs one drone hit. After the hit you blink and
  are safe for a moment so you can escape.
- **Sword** (silver blade): a sword spins slowly around you (one turn every 3 seconds). Any drone it
  touches is destroyed and gives you 1 point; 2 seconds later the drone comes back from a random spot
  on the edge of the board.

Drones move at 150 px/s. Timings are in `settings.js` under `shield` and `sword`.

## More drones over time

The round starts with 3 drones, and one more joins every 8 seconds until there are 8. A new drone
always appears well away from you, so it never catches you the moment it spawns. No drones are added
while the game is paused or after the round ends, and R starts again with 3. Tuning is in `settings.js`
(`droneCount`, `droneEvery`, `droneMax`, `droneSpawnDistance`).

## Run it locally

Clone the repository and open `index.html` in a browser. Everything is in the repository;
there is no package to install, no build step, no backend, and nothing is fetched from the network.
If your agent prefers a local server, let it serve this folder, for example with
`python3 -m http.server 8000`, and open `http://localhost:8000`.

## Use it in the lab

This is a template repository. One partner creates the pair's own repository from it
(the **Use this template** button, or `gh repo create <name> --template avivz/coin-dash --public --clone`)
and adds the other partner as a collaborator. Both clone it and open `index.html`.

## Lab report

The repository includes a `lab-report` skill: use `/lab-report` in Claude Code or `$lab-report`
in Codex, for the pre-lab practice run and at the end of the lab. Give it your name, a unique
laptop label, and the session's start and end times with timezone. If it is not listed, ask
your agent to read `.claude/skills/lab-report/SKILL.md` and follow it.

The skill writes a JSON export and a report page under `reports/`, which Git ignores.
Open that page, load your JSON, and check the result. For the final pair report, load both
laptops' JSON files together and save the combined HTML. Use the same time window on both laptops.

## Files

- `.claude/skills/lab-report/`: reporting skill and offline HTML page.
- `.agents/skills/lab-report`: link to the same skill for Codex.
- `.gitignore`: keeps generated reports out of Git.
- `index.html`: page and script loading.
- `style.css`: page appearance.
- `settings.js`: round duration, speeds, colours, dimensions, power-up timings (shield, sword) and drone growth.
- `game.js`: scene, input, pause, collisions, shield and sword power-ups, growing drone count, score, saved high score and end-of-round behaviour.
- `vendor/phaser-3.90.0.min.js`: the pinned Phaser runtime, byte for byte the file published at
  `https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js`; `vendor/LICENSE.phaser.txt` is its MIT licence.

The game draws its own shapes; there are no image or audio assets. The authored files are under the
MIT licence in LICENSE.txt. Phaser documentation:
https://docs.phaser.io/phaser/getting-started/making-your-first-phaser-game
