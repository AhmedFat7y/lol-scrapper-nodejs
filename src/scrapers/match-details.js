import ScraperBase from './base';

import {
	SummonerDataStore,
	MatchDataStore,
	MatchTimelineDatastore,
} from '../datastore';

export default class MatchDetailsScraper extends ScraperBase {
	async initialize() {
		await MatchDataStore.resetProcessing();
	}

	async execute() {
		const match = await MatchDataStore.findUnprocessedSingle();
		if (!match) {
			console.log('No Match Found');
			return false;
		}
		const { gameId, participantIdentities } = match;
		if (!participantIdentities) {
			console.log('Fetch Details for Match:', gameId);
			const matchDetails = await this.apis.getMatchDetails(gameId);
			const players = matchDetails.participantIdentities.map(
				participant => {
					return {
						accountId: participant.player.currentAccountId,
						name: participant.player.summonerName,
						platformId: participant.player.currentPlatformId,
					};
				}
			);
			await MatchDataStore.updateWithID(gameId, matchDetails);
			await SummonerDataStore.saveMany(players);
		}
		console.log('Fetch timeline for Match:', gameId);
		const timeline = await this.apis.getMatchTimeline(gameId);
		await MatchTimelineDatastore.save(timeline);
		await MatchDataStore.markProcessed(gameId);
		return true;
	}
}
