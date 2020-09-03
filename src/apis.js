import TeemoJS from 'teemojs';
import pm2 from 'pm2';
import ecosystemConfig from '../ecosystem.config';
import Logger from './logger';

const logger = new Logger('apis');
pm2.connect((error) => {
	error && logger.error(error);
});

export default class API {
	constructor(apiKey, regionName) {
		this.apiKey = apiKey;
		this.regionName = regionName;
		this.client = TeemoJS(apiKey);
	}
	async get(...args) {
		const res = await this.client.get(...args);
		if ([401, 403].includes(res?.status?.status_code)) {
			logger.error(res);
			pm2.stop(ecosystemConfig.apps[0].name, (error) => {
				error && logger.error(error);
			});
		} else if (res?.status?.message) {
			return null;
		}
		return res;
	}
	async getSummoner({ accountId, region }) {
		return this.get(region || this.regionName, 'summoner.getByAccountId', accountId);
	}

	async getMatchList({ accountId, region, query = { beginIndex: 0 } }) {
		return this.get(region || this.regionName, 'match.getMatchlist', accountId, query);
	}

	async getMatchDetails({ gameId, region }) {
		return this.get(region || this.regionName, 'match.getMatch', gameId);
	}

	async getMatchTimeline({ gameId, region }) {
		return this.get(region || this.regionName, 'match.getMatchTimeline', gameId);
	}
}
