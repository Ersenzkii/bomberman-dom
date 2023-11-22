import {
  BASE_FRAME,
  BOMB_ANIMATION,
  BOMB_FRAME_DELAY,
  FUSE_TIMER
} from '../constants/bombs.js';
import {
  drawTile
} from '../../engine/context.js';
import {
  TILE_SIZE
} from '../constants/game.js';

export class Bomb {

  image = document.querySelector('img#stage');
  animationFrame = 0;


  constructor(cell, time, onEnd) {
    this.cell = cell;
    this.onEnd = onEnd;

    this.animationTimer = time.previous + BOMB_FRAME_DELAY;
    this.fuseTimer = time.previous + FUSE_TIMER;
  }

  updateAnimation = (time) => {
    if (time.previous < this.animationTimer) return;

    this.animationFrame += 1;
    if (this.animationFrame >= BOMB_ANIMATION.length) this.animationFrame = 0;
    this.animationTimer = time.previous + BOMB_FRAME_DELAY;
  }

  updateFuse = (time) => {
    if (time.previous < this.fuseTimer) return;
    this.onEnd(this);
  }


  update(time) {
    // Add your main update calls here

    this.updateAnimation(time);
    this.updateFuse(time)
  }

  draw(context, camera) {
    // Add your main draw calls here

    drawTile(
      context, this.image,
      BASE_FRAME + BOMB_ANIMATION[this.animationFrame],
      (this.cell.column * TILE_SIZE) - camera.position.x,
      (this.cell.row * TILE_SIZE) - camera.position.y,
      TILE_SIZE,
    );
  }
}