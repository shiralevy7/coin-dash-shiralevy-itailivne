// Keep tuning separate from game behaviour so features can be developed independently.
window.COIN_DASH = {
  width: 800,
  height: 500,
  roundSeconds: 45,
  playerSpeed: 240,
  droneSpeed: 105,
  droneCount: 3,
  // Shield power-up: appears every minDelay..maxDelay seconds, stays lifetime seconds, absorbs one hit.
  shield: { minDelay: 4, maxDelay: 6, lifetime: 6, graceMs: 1200, color: 0x7aa2ff },
  // Sword orbiting the player: blade from inner to inner+length px, kills drones it touches.
  sword: { inner: 16, length: 40, degPerSecond: 120, respawnMs: 2000, color: 0xdfe7f2 },
  colors: { background: 0x101c31, player: 0x71e8ce, coin: 0xffd166, drone: 0xff657a }
};
