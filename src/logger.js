/* eslint-disable no-console */
import { CURRENT_REGION } from './config';

export default class Logger {
	constructor(prefix) {
		this.prefix = prefix;
	}
	getPrefix() {
		return `[${CURRENT_REGION}][${this.prefix}]`;
	}
	log(...args) {
		console.log(`${this.getPrefix()}:`, ...args);
	}
	error(...args) {
		console.error(`${this.getPrefix()}:`, ...args);
	}
}
