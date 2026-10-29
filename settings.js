// Keep tuning separate from game behaviour so features can be developed independently.
window.COIN_DASH = {
  width: 800,
  height: 500,
  roundSeconds: 45,
  playerSpeed: 240,
  droneSpeed: 150,
  droneCount: 3,
  // Power-ups appear every minDelay..maxDelay s, wait lifetime s, and last duration s once picked up.
  // Shield absorbs one hit; sword orbits the player (blade from inner to inner+length px) and kills drones.
  shield: { minDelay: 4, maxDelay: 6, lifetime: 6, duration: 5, graceMs: 1200, color: 0x7aa2ff },
  sword: { minDelay: 4, maxDelay: 6, lifetime: 6, duration: 5, inner: 16, length: 40, degPerSecond: 120,
    respawnMs: 2000, color: 0xdfe7f2 },
  colors: { background: 0x101c31, player: 0x71e8ce, coin: 0xffd166, drone: 0xff657a }
};
