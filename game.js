/* global Phaser, COIN_DASH */
class CoinDash extends Phaser.Scene {
  constructor() { super('CoinDash'); }

  create() {
    const c = COIN_DASH;
    this.score = 0;
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
      this.score++;
      this.placeCoin();
    });
    this.createShield();
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

  placeCoin() {
    const { x, y } = this.randomSpot();
    this.coin.setPosition(x, y);
    this.coin.body.reset(x, y);
  }

  createShield() {
    const s = COIN_DASH.shield;
    this.shielded = false;
    this.graceLeft = 0;
    this.powerUp = this.add.star(0, 0, 5, 6, 13, s.color).setVisible(false);
    this.physics.add.existing(this.powerUp);
    this.powerUp.body.enable = false;
    this.shieldRing = this.add.circle(0, 0, 22).setStrokeStyle(3, s.color).setVisible(false);
    this.physics.add.overlap(this.player, this.powerUp, () => {
      if (this.finished) return;
      this.hidePowerUp();
      this.shielded = true;
      this.shieldRing.setVisible(true);
      this.flashText('SHIELD!');
    });
    this.hidePowerUp();
  }

  // Timers count down in update(), so they stop while the game is paused or over.
  hidePowerUp() {
    const s = COIN_DASH.shield;
    this.powerUp.setVisible(false);
    this.powerUp.body.enable = false;
    this.spawnLeft = Phaser.Math.Between(s.minDelay * 1000, s.maxDelay * 1000);
  }

  showPowerUp() {
    const { x, y } = this.randomSpot();
    this.powerUp.setPosition(x, y).setVisible(true);
    this.powerUp.body.enable = true;
    this.powerUp.body.reset(x, y);
    this.lifeLeft = COIN_DASH.shield.lifetime * 1000;
  }

  hitDrone() {
    if (this.graceLeft > 0) return;
    if (!this.shielded) return this.finish('A drone caught you!');
    // The shield absorbs the hit; a short grace period lets the player get clear of the drone.
    this.shielded = false;
    this.shieldRing.setVisible(false);
    this.graceLeft = COIN_DASH.shield.graceMs;
    this.flashText('SHIELD BROKEN');
  }

  updateShield(delta) {
    this.shieldRing.setPosition(this.player.x, this.player.y);
    if (this.graceLeft > 0) {
      this.graceLeft -= delta;
      this.player.setAlpha(this.graceLeft > 0 && Math.floor(this.graceLeft / 100) % 2 ? 0.3 : 1);
    }
    if (this.powerUp.visible) {
      this.lifeLeft -= delta;
      if (this.lifeLeft <= 0) this.hidePowerUp();
    } else {
      this.spawnLeft -= delta;
      if (this.spawnLeft <= 0) this.showPowerUp();
    }
  }

  flashText(message) {
    const label = this.add.text(this.player.x, this.player.y - 30, message,
      { font: '16px monospace', color: '#ffffff' }).setOrigin(0.5).setDepth(5);
    this.tweens.add({ targets: label, y: label.y - 30, alpha: 0, duration: 900,
      onComplete: () => label.destroy() });
  }

  update(time, delta) {
    if (this.finished || this.paused) return;
    this.updateShield(delta);
    const dx = Number(this.cursors.right.isDown || this.keys.D.isDown)
      - Number(this.cursors.left.isDown || this.keys.A.isDown);
    const dy = Number(this.cursors.down.isDown || this.keys.S.isDown)
      - Number(this.cursors.up.isDown || this.keys.W.isDown);
    const direction = new Phaser.Math.Vector2(dx, dy).normalize().scale(COIN_DASH.playerSpeed);
    this.player.body.setVelocity(direction.x, direction.y);
    const seconds = Math.max(0, Math.ceil((this.deadline - this.time.now) / 1000));
    this.hud.setText(`Coins: ${this.score}                       Time: ${seconds}s`);
    if (seconds === 0) this.finish('Time is up!');
  }

  finish(reason) {
    if (this.finished) return;
    this.finished = true;
    this.physics.pause();
    const c = COIN_DASH;
    this.add.rectangle(c.width / 2, c.height / 2, 460, 150, 0x0a1120, 0.95);
    this.add.text(c.width / 2, c.height / 2,
      `${reason}\n${this.score} coins collected\nPress R to try again`,
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
