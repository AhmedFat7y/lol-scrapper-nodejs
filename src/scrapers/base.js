export default class ScraperBase {
	constructor(apis) {
		this.apis = apis;
	}
	async initialize() {
		throw new Error('Not Implemented');
	}

	async execute() {
		throw new Error('Not Implemented');
	}

	async start() {
		const result = await this.execute().catch(console.error);
		const boundStart = this.start.bind(this);
		if (result) {
			setImmediate(boundStart);
		} else {
			setTimeout(boundStart, 5 * 1000);
		}
	}
}
