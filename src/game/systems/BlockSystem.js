import {
	Block
} from 'game/entities/block.js';
import {
	MapTile,
	CollisionTile,
	playerStartCoords,
	stageData,
} from '../constants/levelData.js';

export class BlockSystem {
	blocks = [];

	constructor(updateStageMapAt, getStageCollisionTileAt) {
		this.updateStageMapAt = updateStageMapAt;
		this.getStageCollisionTileAt = getStageCollisionTileAt;

		this.addBlocksToStage()
	}

	isBlockAllowedAt = (cell) => {
		const isStartZone = playerStartCoords.some(([startRow, startColumn]) =>
			startRow === cell.row && startColumn === cell.column,
		)

		if (isStartZone || this.getStageCollisionTileAt(cell) !== CollisionTile.EMPTY) return false;

		return true;
	}

	addBlocksToStage = () => {
		while (this.blocks.length < stageData.maxBlocks) {
			const cell = {
				row: 1 + Math.floor(Math.random() * (stageData.tiles.length - 3)),
				column: 2 + Math.floor(Math.random() * (stageData.tiles[0].length - 4)),
			};

			if (!this.isBlockAllowedAt(cell)) continue; 

			this.updateStageMapAt(cell, MapTile.BLOCK);
			this.blocks.push({ 
				cell,
				entity: undefined, 
			});
		}
	}

	remove = (destroyedBlock) => {
		const index = this.blocks.findIndex((block) => 
			block.cell.row === destroyedBlock.cell.row && block.cell.column === destroyedBlock.cell.column,
		);
		if (index < 0) return;

		this.updateStageMapAt(destroyedBlock.cell, MapTile.FLOOR);
		this.blocks.splice(index, 1)
	};

	add = (cell, time) => {
		const index = this.blocks.findIndex((block) => 
			block.cell.row === cell.row && block.cell.column === cell.column,
		);
		if (index < 0) return;

		this.blocks[index].entity = new Block(cell, time, this.remove);
	};

	update(time) {
		for (const block of this.blocks) {
			block.entity?.update(time)
		}
	}

	draw(context, camera) {
		for (const block of this.blocks) {
			block.entity?.draw(context, camera)
		}
	}
}