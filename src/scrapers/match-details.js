import ScraperBase from './base';
import Utils from '../utils';

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
		let { gameId, participantIdentities } = match;
		if (!participantIdentities) {
			console.log('Fetch Details for Match:', gameId);
			const matchDetails = await this.apis.getMatchDetails(gameId);
			participantIdentities = matchDetails.participantIdentities;
			await MatchDataStore.updateWithID(gameId, matchDetails);
		}
		const players = participantIdentities.map(participant => {
			return {
				accountId: participant.player.currentAccountId,
				name: participant.player.summonerName,
				platformId: participant.player.currentPlatformId,
			};
		});
		const existingPlayers = await SummonerDataStore.findInIdList(
			players.map(player => player.accountId)
		);
		const nonExistPlayers = Utils.filterExistingItems(
			players,
			existingPlayers,
			'accountId'
		);
		if (nonExistPlayers.length > 0) {
			console.log(
				'Saving',
				nonExistPlayers.length,
				'summoners from',
				players.length,
				'summoners'
			);
			await SummonerDataStore.saveMany(nonExistPlayers);
		}
		const matchTimelineExists = MatchTimelineDatastore.checkExists(gameId);
		if (!matchTimelineExists) {
			console.log('Fetch timeline for Match:', gameId);
			const timeline = await this.apis.getMatchTimeline(gameId);
			await MatchTimelineDatastore.save(timeline);
			await MatchDataStore.markProcessed(gameId);
		}
		return true;
	}
}
