import {
	Entity
} from 'engine/Entity.js';
import {
	SCREEN_WIDTH,
	STAGE_OFFSET_Y
} from '../constants/game.js'

export class battleHud extends Entity{
	constructor(position) {
		super(position);

		this.image = document.querySelector("img#hud");

	}

	update(time, context, camera) {

	}

	draw(context) {
		context.drawImage(
			this.image,
			 8, 40, SCREEN_WIDTH, STAGE_OFFSET_Y,
			 0, 0, SCREEN_WIDTH, STAGE_OFFSET_Y
		);
	}
}