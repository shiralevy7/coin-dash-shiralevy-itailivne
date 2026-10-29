/* global Phaser, COIN_DASH */
const HIGH_SCORE_KEY = 'coinDash.highScore';

// Storage can be unavailable (private browsing, blocked site data), so fall back to 0 / no-op.
function loadHighScore() {
  try {
    const value = parseInt(localStorage.getItem(HIGH_SCORE_KEY), 10);
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch (e) {
    return 0;
  }
}

function saveHighScore(score) {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(score));
  } catch (e) { /* ignore */ }
}

class CoinDash extends Phaser.Scene {
  constructor() { super('CoinDash'); }

  create() {
    const c = COIN_DASH;
    this.score = 0;
    this.highScore = loadHighScore();
    this.finished = false;
    this.paused = false;
    this.deadline = this.time.now + c.roundSeconds * 1000;
    this.physics.world.setBounds(0, 44, c.width, c.height - 44);
    this.add.grid(c.width / 2, c.height / 2, c.width, c.height, 40, 40,
      c.colors.background, 1, 0x24334b, 0.45);
    this.hud = this.add.text(18, 12, '', { font: '18px monospace', color: '#ffffff' });
    this.player = this.add.rectangle(c.width / 2, c.height / 2, 24, 24, c.colors.player);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    this.coin = this.add.circle(100, 100, 9, c.colors.coin);
    this.physics.add.existing(this.coin);
    this.coin.body.setCircle(9);
    this.placeCoin();
    this.drones = this.physics.add.group();
    for (let i = 0; i < c.droneCount; i++) {
      const drone = this.add.rectangle(90 + i * 270, 100, 26, 26, c.colors.drone);
      this.drones.add(drone);
      drone.body.setCollideWorldBounds(true).setBounce(1, 1);
      const angle = (35 + i * 105) * Math.PI / 180;
      drone.body.setVelocity(Math.cos(angle) * c.droneSpeed, Math.sin(angle) * c.droneSpeed);
    }
    this.physics.add.overlap(this.player, this.coin, () => {
      if (this.finished) return;
      this.addPoint();
      this.placeCoin();
    });
    this.createPowerUps();
    this.physics.add.overlap(this.player, this.drones, () => this.hitDrone());
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,R,P');
    this.input.keyboard.on('keydown-R', () => this.scene.restart());
    this.input.keyboard.on('keydown-P', () => this.togglePause());
    this.pauseText = this.add.text(c.width / 2, c.height / 2, 'PAUSED',
      { font: '48px monospace', color: '#ffffff' }).setOrigin(0.5).setDepth(10).setVisible(false);
  }

  togglePause() {
    if (this.finished) return;
    this.paused = !this.paused;
    if (this.paused) {
      this.pausedAt = this.time.now;
      this.physics.pause();
    } else {
      // Shift the deadline so time spent paused does not count against the round.
      this.deadline += this.time.now - this.pausedAt;
      this.physics.resume();
    }
    this.pauseText.setVisible(this.paused);
  }

  // A random spot in the play area that is not directly underneath the player.
  randomSpot() {
    const c = COIN_DASH;
    let x, y;
    do {
      x = Phaser.Math.Between(25, c.width - 25);
      y = Phaser.Math.Between(70, c.height - 25);
    } while (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < 60);
    return { x, y };
  }

  addPoint() {
    this.score++;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      saveHighScore(this.highScore);
    }
  }

  placeCoin() {
    const { x, y } = this.randomSpot();
    this.coin.setPosition(x, y);
    this.coin.body.reset(x, y);
  }

  // Power-ups: each kind appears every minDelay..maxDelay s, waits lifetime s, and lasts duration s once taken.
  // Timers count down in update(), so they stop while the game is paused or over.
  createPowerUps() {
    const { shield, sword } = COIN_DASH;
    this.graceLeft = 0;
    this.shieldLeft = 0;
    this.swordLeft = 0;
    this.swordAngle = 0;
    this.shieldRing = this.add.circle(0, 0, 22).setStrokeStyle(3, shield.color).setVisible(false);
    this.sword = this.add.rectangle(0, 0, sword.length, 6, sword.color).setDepth(2).setVisible(false);
    this.powerUps = [
      { kind: 'shield', item: this.add.star(0, 0, 5, 6, 13, shield.color) },
      { kind: 'sword', item: this.add.rectangle(0, 0, 6, 26, sword.color).setAngle(45) }
    ];
    this.powerUps.forEach(p => this.hidePowerUp(p));
  }

  hidePowerUp(p) {
    const s = COIN_DASH[p.kind];
    p.item.setVisible(false);
    p.spawnLeft = Phaser.Math.Between(s.minDelay * 1000, s.maxDelay * 1000);
  }

  showPowerUp(p) {
    const { x, y } = this.randomSpot();
    p.item.setPosition(x, y).setVisible(true);
    p.lifeLeft = COIN_DASH[p.kind].lifetime * 1000;
  }

  collectPowerUp(p) {
    this.hidePowerUp(p);
    if (p.kind === 'shield') this.shieldLeft = COIN_DASH.shield.duration * 1000;
    else this.swordLeft = COIN_DASH.sword.duration * 1000;
    this.flashText(p.kind === 'shield' ? 'SHIELD!' : 'SWORD!');
  }

  // Blink during the last second so the player sees a power-up running out.
  fadeAlpha(msLeft) {
    return msLeft < 1000 && Math.floor(msLeft / 100) % 2 ? 0.3 : 1;
  }

  updatePowerUps(delta) {
    for (const p of this.powerUps) {
      if (p.item.visible) {
        if (Phaser.Math.Distance.Between(p.item.x, p.item.y, this.player.x, this.player.y) < 24) {
          this.collectPowerUp(p);
        } else if ((p.lifeLeft -= delta) <= 0) {
          this.hidePowerUp(p);
        }
      } else if ((p.spawnLeft -= delta) <= 0) {
        this.showPowerUp(p);
      }
    }
    this.shieldLeft = Math.max(0, this.shieldLeft - delta);
    this.swordLeft = Math.max(0, this.swordLeft - delta);
    this.shieldRing.setPosition(this.player.x, this.player.y)
      .setVisible(this.shieldLeft > 0).setAlpha(this.fadeAlpha(this.shieldLeft));
    if (this.graceLeft > 0) {
      this.graceLeft -= delta;
      this.player.setAlpha(this.graceLeft > 0 && Math.floor(this.graceLeft / 100) % 2 ? 0.3 : 1);
    }
    this.updateSword(delta);
  }

  hitDrone() {
    if (this.graceLeft > 0) return;
    if (this.shieldLeft <= 0) return this.finish('A drone caught you!');
    // The shield absorbs the hit; a short grace period lets the player get clear of the drone.
    this.shieldLeft = 0;
    this.graceLeft = COIN_DASH.shield.graceMs;
    this.flashText('SHIELD BROKEN');
  }

  // Arcade bodies cannot rotate, so test points along the blade against each live drone.
  updateSword(delta) {
    const s = COIN_DASH.sword;
    const armed = this.swordLeft > 0;
    this.swordAngle += s.degPerSecond * delta / 1000;
    const angle = Phaser.Math.DegToRad(this.swordAngle);
    const mid = s.inner + s.length / 2;
    this.sword.setPosition(this.player.x + Math.cos(angle) * mid, this.player.y + Math.sin(angle) * mid)
      .setRotation(angle).setVisible(armed).setAlpha(this.fadeAlpha(this.swordLeft));
    for (const drone of this.drones.getChildren()) {
      if (!drone.body.enable) {
        drone.respawnLeft -= delta;
        if (drone.respawnLeft <= 0) this.respawnDrone(drone);
        continue;
      }
      if (!armed) continue;
      const bounds = drone.getBounds();
      for (let r = s.inner; r <= s.inner + s.length; r += 5) {
        if (bounds.contains(this.player.x + Math.cos(angle) * r, this.player.y + Math.sin(angle) * r)) {
          this.killDrone(drone);
          break;
        }
      }
    }
  }

  killDrone(drone) {
    drone.setVisible(false);
    drone.body.enable = false;
    drone.respawnLeft = COIN_DASH.sword.respawnMs;
    this.addPoint();
  }

  // Bring a drone back on a random edge of the board, heading inward.
  respawnDrone(drone) {
    const c = COIN_DASH, top = 44 + 13, bottom = c.height - 13, left = 13, right = c.width - 13;
    let x, y;
    do {
      const side = Phaser.Math.Between(0, 3);
      x = side === 2 ? left : side === 3 ? right : Phaser.Math.Between(left, right);
      y = side === 0 ? top : side === 1 ? bottom : Phaser.Math.Between(top, bottom);
    } while (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < 150);
    const angle = Phaser.Math.Angle.Between(x, y, c.width / 2, (c.height + 44) / 2)
      + Phaser.Math.FloatBetween(-0.6, 0.6);
    drone.setVisible(true);
    drone.body.enable = true;
    drone.body.reset(x, y);
    drone.body.setVelocity(Math.cos(angle) * c.droneSpeed, Math.sin(angle) * c.droneSpeed);
  }

  flashText(message) {
    const label = this.add.text(this.player.x, this.player.y - 30, message,
      { font: '16px monospace', color: '#ffffff' }).setOrigin(0.5).setDepth(5);
    this.tweens.add({ targets: label, y: label.y - 30, alpha: 0, duration: 900,
      onComplete: () => label.destroy() });
  }

  update(time, delta) {
    if (this.finished || this.paused) return;
    this.updatePowerUps(delta);
    const dx = Number(this.cursors.right.isDown || this.keys.D.isDown)
      - Number(this.cursors.left.isDown || this.keys.A.isDown);
    const dy = Number(this.cursors.down.isDown || this.keys.S.isDown)
      - Number(this.cursors.up.isDown || this.keys.W.isDown);
    const direction = new Phaser.Math.Vector2(dx, dy).normalize().scale(COIN_DASH.playerSpeed);
    this.player.body.setVelocity(direction.x, direction.y);
    const seconds = Math.max(0, Math.ceil((this.deadline - this.time.now) / 1000));
    this.hud.setText(`Coins: ${this.score}          Best: ${this.highScore}          Time: ${seconds}s`);
    if (seconds === 0) this.finish('Time is up!');
  }

  finish(reason) {
    if (this.finished) return;
    this.finished = true;
    this.physics.pause();
    const c = COIN_DASH;
    this.add.rectangle(c.width / 2, c.height / 2, 460, 150, 0x0a1120, 0.95);
    this.add.text(c.width / 2, c.height / 2,
      `${reason}\n${this.score} coins collected · Best: ${this.highScore}\nPress R to try again`,
      { font: '24px monospace', color: '#ffffff', align: 'center', lineSpacing: 12 }
    ).setOrigin(0.5);
  }
}
window.coinDashGame = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: COIN_DASH.width,
  height: COIN_DASH.height,
  backgroundColor: COIN_DASH.colors.background,
  physics: { default: 'arcade', arcade: { debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_HORIZONTALLY },
  scene: CoinDash
});
