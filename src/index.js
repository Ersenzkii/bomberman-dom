import {
	bombermanDom
} from 'game/bombermanDom.js';

window.addEventListener('load', () => {
	new bombermanDom().start();
});