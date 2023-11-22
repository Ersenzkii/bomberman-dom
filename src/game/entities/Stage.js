import {
	Entity
} from 'engine/Entity.js';
import {
	CollisionTile,
	MapToCollisionTileLookup,
	STAGE_MAP_MAX_SIZE,
	stageData,
} from '../constants/levelData.js';
import {
	drawTile
} from '../../engine/context.js';
import {
	TILE_SIZE
} from '../constants/game.js';

export class Stage extends Entity {
	constructor() {
		super({
			x: 0,
			y: 0
		});

		this.tileMap = structuredClone(stageData.tiles);
		this.collisionMap = stageData.tiles.map((row) => row.map((tile) => MapToCollisionTileLookup[tile]));
		this.image = document.querySelector('img#stage');
		this.stageImage = new OffscreenCanvas(STAGE_MAP_MAX_SIZE, STAGE_MAP_MAX_SIZE);
		this.stageImageContext = this.stageImage.getContext('2d');

		this.buildStageMap();

	}

	getCollisionTileAt = (cell) => {
		return this.collisionMap[cell.row][cell.column] ?? CollisionTile.EMPTY;
	}

	updateMapAt = (cell, tile) => {
		this.tileMap[cell.row][cell.column] = tile;
		this.collisionMap[cell.row][cell.column] = MapToCollisionTileLookup[tile];

		drawTile(this.stageImageContext, this.image, tile, cell.column * TILE_SIZE, cell.row * TILE_SIZE, TILE_SIZE);
	}

	buildStageMap() {
		for (let rowIndex = 0; rowIndex < this.tileMap.length; rowIndex++) {
			for (let columnIndex = 0; columnIndex < this.tileMap[rowIndex].length; columnIndex++) {
				const tile = this.tileMap[rowIndex][columnIndex];
				this.updateMapAt({
					row: rowIndex,
					column: columnIndex
				}, tile);
			}
		}
	}

	update = () => undefined;

	draw(context, camera) {
		context.drawImage(this.stageImage, -camera.position.x, -camera.position.y);
	}
}