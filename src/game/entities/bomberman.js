import {
	Entity
} from 'engine/Entity.js';
import {
	CounterDirectionLookup,
	Direction,
	MovementLookup
} from '../constants/entities.js';
import {
	WALK_SPEED,
	animations,
	frames
} from '../constants/bomberman.js';
import {
	DEBUG,
	FRAME_TIME,
	HALF_TILE_SIZE,
	TILE_SIZE
} from '../constants/game.js';
import {
	drawFrameOrigin
} from '../../engine/context.js';
import {
	BombermanStateType
} from '../constants/bomberman.js';
import * as control from 'engine/inputHandler.js';
import {
	isZero
} from '../utils/utils.js';
import {
	CollisionTile,
} from '../constants/levelData.js';
import {
	drawBox,
	drawCross
} from '../utils/debug.js';
import * as Control from '../constants/controls.js';
import {
	isControlPressed
} from '../../engine/inputHandler.js';

export class bomberman extends Entity {
	image = document.querySelector('img#bomberman');

	id = 0;
	direction = Direction.DOWN;
	baseSpeedTime = WALK_SPEED;
	speedMultiplier = 1.2;
	animation = animations.moveAnimations[this.direction];

	bombAmount = 5;
	bombStrength = 2;
	availableBombs = this.bombAmount;
	lastBombCell = undefined;

	constructor(position, time, getStageCollisionTileAt, onBombPlaced) {
		super({
			x: (position.x * TILE_SIZE) + HALF_TILE_SIZE,
			y: (position.y * TILE_SIZE) + HALF_TILE_SIZE
		});

		this.states = {
			[BombermanStateType.IDLE]: {
				type: BombermanStateType.IDLE,
				init: this.handleIdleInit,
				update: this.handleIdleState,
			},
			[BombermanStateType.MOVING]: {
				type: BombermanStateType.MOVING,
				init: this.handleMovingInit,
				update: this.handleMovingState,
			},
			[BombermanStateType.DEATH]: {
				type: BombermanStateType.DEATH,
				init: this.handleDeathInit,
				update: this.handleDeathState,
			},
		};

		this.startPosition = {
			...this.position
		};
		this.getStageCollisionTileAt = getStageCollisionTileAt;
		this.onBombPlaced = onBombPlaced;

		this.changeState(BombermanStateType.IDLE, time);
	}

	changeState = (newState, time) => {
		this.currentState = this.states[newState];
		this.animationFrame = 0;

		this.currentState.init(time);
		this.animationTimer = time.previous + this.animation[this.animationFrame][1] * FRAME_TIME;
	}

	resetVelocity = () => {
		this.velocity.x = 0;
		this.velocity.y = 0;
	}

	reset = (time) => {
		this.animationFrame = 0;
		this.direction = Direction.DOWN;
		this.position = {
			...this.startPosition
		};
		this.resetVelocity()
		this.changeState(BombermanStateType.IDLE, time);
	}

	getCollisionTile(cell) {
		if (
			this.lastBombCell && cell.row === this.lastBombCell.row
			&& cell.column === this.lastBombCell.column
		) return CollisionTile.EMPTY;

			return this.getStageCollisionTileAt(cell);

	}

	getCollisionCoords(direction) {
		switch (direction) {
			case Direction.UP:
				return [{
					row: Math.floor((this.position.y - 9) / TILE_SIZE),
					column: Math.floor((this.position.x - 8) / TILE_SIZE)
				}, {
					row: Math.floor((this.position.y - 9) / TILE_SIZE),
					column: Math.floor((this.position.x + 7) / TILE_SIZE)
				}, ];
			case Direction.LEFT:
				return [{
					row: Math.floor((this.position.y - 8) / TILE_SIZE),
					column: Math.floor((this.position.x - 9) / TILE_SIZE)
				}, {
					row: Math.floor((this.position.y + 7) / TILE_SIZE),
					column: Math.floor((this.position.x - 9) / TILE_SIZE)
				}, ];
			case Direction.RIGHT:
				return [{
					row: Math.floor((this.position.y - 8) / TILE_SIZE),
					column: Math.floor((this.position.x + 8) / TILE_SIZE)
				}, {
					row: Math.floor((this.position.y + 7) / TILE_SIZE),
					column: Math.floor((this.position.x + 8) / TILE_SIZE)
				}, ];
			default:
			case Direction.DOWN:
				return [{
					row: Math.floor((this.position.y + 8) / TILE_SIZE),
					column: Math.floor((this.position.x - 8) / TILE_SIZE)
				}, {
					row: Math.floor((this.position.y + 8) / TILE_SIZE),
					column: Math.floor((this.position.x + 7) / TILE_SIZE)
				}, ];
		}
	}

	shouldBlockMovement(tileCoords) {
		const tileCoordsMatch = tileCoords[0].column === tileCoords[1].column && tileCoords[0].row === tileCoords[1].row;
		const collisionTiles = [this.getCollisionTile(tileCoords[0]), this.getCollisionTile(tileCoords[1])];

		if (
			(tileCoordsMatch && collisionTiles[0] >= CollisionTile.WALL) || (collisionTiles[0] >= CollisionTile.WALL && collisionTiles[1] >= CollisionTile.WALL)) {
			return true;
		}
		return false;
	}

	performWallCheck(direction) {
		const collisionCoords = this.getCollisionCoords(direction);

		if (this.shouldBlockMovement(collisionCoords)) return [this.direction, {
			x: 0,
			y: 0
		}]

		const counterDirections = CounterDirectionLookup[direction];
		if (this.getCollisionTile(collisionCoords[0]) >= CollisionTile.WALL) {
			return [counterDirections[0], {
				...MovementLookup[counterDirections[0]]
			}];
		}

		if (this.getCollisionTile(collisionCoords[1]) >= CollisionTile.WALL) {
			return [counterDirections[1], {
				...MovementLookup[counterDirections[1]]
			}];
		}

		return [direction, {
			...MovementLookup[direction]
		}]
	}

	getMovement() {
		if (control.isLeft(this.id)) {
			return this.performWallCheck(Direction.LEFT);
		} else if (control.isRight(this.id)) {
			return this.performWallCheck(Direction.RIGHT);
		} else if (control.isDown(this.id)) {
			return this.performWallCheck(Direction.DOWN);
		} else if (control.isUp(this.id)) {
			return this.performWallCheck(Direction.UP);
		}

		return [this.direction, {
			x: 0,
			y: 0
		}]
	}

	handleIdleInit = () => {
		this.resetVelocity();
	}

	handleMovingInit = () => {
		this.animationFrame = 1;
	}

	handleDeathInit = () => {
		this.resetVelocity();
		this.animation = animations.deathAnimation;
	}

	handleGeneralState = (time) => {
		const [direction, velocity] = this.getMovement();
		if (control.isAction(this.id)) {
			this.handleBombPlacement(time);
		}
		this.animation = animations.moveAnimations[direction];
		this.direction = direction;

		return velocity;
	}

	handleIdleState = (time) => {
		const velocity = this.handleGeneralState(time);

		if (isZero(velocity)) return;

		this.changeState(BombermanStateType.MOVING, time);
	}

	handleMovingState = (time) => {
		this.velocity = this.handleGeneralState(time);

		if (!isZero(this.velocity)) return;

		this.changeState(BombermanStateType.IDLE, time);
	}

	handleDeathState = (time) => {
		if (this.animationFrame >= animations.deathAnimation.length - 1) this.reset(time);
	}

	handleBombExploded = () => {
		if (this.availableBombs < this.bombAmount) this.availableBombs += 1;
	}

	handleBombPlacement = (time) => {
		if (this.availableBombs <= 0) return;

		const playerCell = {
			row: Math.floor(this.position.y / TILE_SIZE),
			column: Math.floor(this.position.x / TILE_SIZE),
		};
		if (this.getStageCollisionTileAt(playerCell) !== CollisionTile.EMPTY) return;

		this.availableBombs -= 1;
		this.lastBombCell = playerCell;

		this.onBombPlaced(playerCell, this.bombStrength, time, this.handleBombExploded);
	}

	checkFlameFileCollision = (time) => {
		const playerCell = {
			row: Math.floor(this.position.y / TILE_SIZE),
			column: Math.floor(this.position.x / TILE_SIZE),
		}
		if (
			this.getCollisionTile(playerCell) !== CollisionTile.FLAME ||
			this.currentState.type === BombermanStateType.DEATH
		) return;

		this.changeState(BombermanStateType.DEATH, time);
	}


	updatePosition(time) {
		this.position.x += (this.velocity.x * this.baseSpeedTime * this.speedMultiplier) * time.secondsPassed;
		this.position.y += (this.velocity.y * this.baseSpeedTime * this.speedMultiplier) * time.secondsPassed;
		this.checkFlameFileCollision(time);
	}

	updateAnimation(time) {
		if (time.previous < this.animationTimer || this.currentState.type === BombermanStateType.IDLE) return;

		this.animationFrame += 1;
		if (this.animationFrame >= this.animation.length) this.animationFrame = 0;

		this.animationTimer = time.previous + (this.animation[this.animationFrame][1] * FRAME_TIME);
	}

	resetLastBombCell = () => {
		if (!this.lastBombCell) return;

		const playerCell = {
			row: Math.floor(this.position.y / TILE_SIZE),
			column: Math.floor(this.position.x / TILE_SIZE),
		};

		if (
			(playerCell.row === this.lastBombCell.row && playerCell.column === this.lastBombCell.column)
			&& this.getStageCollisionTileAt(this.lastBombCell) === CollisionTile.BOMB
		) return;

		this.lastBombCell = undefined;
	}

	update(time) {
		this.updatePosition(time);
		this.currentState.update(time);
		this.updateAnimation(time);
		this.resetLastBombCell();
	}

	draw(context, camera) {
		const [frameKey] = this.animation[this.animationFrame];
		const frame = frames.get(frameKey);

		drawFrameOrigin(
			context, this.image, frame,
			Math.floor(this.position.x - camera.position.x),
			Math.floor(this.position.y - camera.position.y),
			[this.direction === Direction.RIGHT ? -1 : 1, 1],
		);

		if (!DEBUG) return;

		drawBox(context, camera, [this.position.x - HALF_TILE_SIZE, this.position.y - HALF_TILE_SIZE, TILE_SIZE - 1, TILE_SIZE - 1, ], '#FFFF00');
		drawCross(context, camera, {
			x: this.position.x,
			y: this.position.y
		}, '#FFF');

	}
}