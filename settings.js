// Keep tuning separate from game behaviour so features can be developed independently.
window.COIN_DASH = {
  width: 800,
  height: 500,
  roundSeconds: 45,
  playerSpeed: 240,
  droneSpeed: 105,
  droneCount: 3,
  // Extra drones: one more every droneEvery seconds, up to droneMax, at least droneSpawnDistance px from the player.
  droneEvery: 8,
  droneMax: 8,
  droneSpawnDistance: 220,
  // Shield power-up: appears every minDelay..maxDelay seconds, stays lifetime seconds, absorbs one hit.
  shield: { minDelay: 4, maxDelay: 6, lifetime: 6, graceMs: 1200, color: 0x7aa2ff },
  colors: { background: 0x101c31, player: 0x71e8ce, coin: 0xffd166, drone: 0xff657a }
};
