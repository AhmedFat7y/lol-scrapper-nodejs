import Logger from '../logger';

const logger = new Logger('base-scraper');

export default class ScraperBase {
	constructor(apis, region) {
		this.apis = apis;
		this.region = region;
	}
	async initialize() {
		throw new Error('Not Implemented');
	}

	async execute() {
		throw new Error('Not Implemented');
	}

	async start() {
		const result = await this.execute().catch(logger.error.bind(logger));
		const boundStart = this.start.bind(this);
		if (result) {
			setImmediate(boundStart);
		} else {
			setTimeout(boundStart, 5 * 1000);
		}
	}
}
