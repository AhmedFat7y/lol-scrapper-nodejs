import TeemoJS from 'teemojs';

export default class API {
	constructor(apiKey, regionName) {
		this.apiKey = apiKey;
		this.regionName = regionName;
		this.client = TeemoJS(apiKey);
	}

	async getSummoner(accountId) {
		return this.client.get(
			this.regionName,
			'summoner.getByAccountId',
			accountId
		);
	}

	async getMatchList(accountId, query = { beginIndex: 0 }) {
		return this.client.get(
			this.regionName,
			'match.getMatchlist',
			accountId,
			query
		);
	}

	async getMatchDetails(matchId) {
		return this.client.get(this.regionName, 'match.getMatch', matchId);
	}

	async getMatchTimeline(matchId) {
		return this.client.get(
			this.regionName,
			'match.getMatchTimeline',
			matchId
		);
	}
}
