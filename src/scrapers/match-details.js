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
		const match = await MatchDataStore.findUnprocessedSingle(this.region);
		if (!match) {
			console.log('No Match Found for region:', this.region);
			return false;
		}
		let { gameId, participantIdentities, platformId } = match;
		if (!participantIdentities) {
			console.log('Fetch Details for Match:', gameId);
			const matchDetails = await this.apis.getMatchDetails({
				gameId,
				region: platformId,
			});
			if (!matchDetails) {
				return false;
			}
			participantIdentities = matchDetails.participantIdentities;
			await MatchDataStore.updateWithID(gameId, matchDetails);
		}
		const players = [];
		for (const participant of participantIdentities) {
			if (
				participant.player.platformId !==
				participant.player.currentPlatformId
			) {
				players.push({
					accountId: participant.player.accountId,
					name: participant.player.summonerName,
					platformId: participant.player.platformId,
				});
			}
			players.push({
				accountId: participant.player.currentAccountId,
				name: participant.player.summonerName,
				platformId: participant.player.currentPlatformId,
			});
		}
		debugger;
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
		const matchTimelineExists = await MatchTimelineDatastore.checkExists(
			gameId,
			platformId
		);
		if (!matchTimelineExists) {
			console.log('Fetch timeline for Match:', gameId);
			const timeline = await this.apis.getMatchTimeline({
				gameId,
				region: platformId,
			});
			if (!timeline) {
				return false;
			}
			await MatchTimelineDatastore.save({
				...timeline,
				gameId,
				platformId,
			});
		}
		await MatchDataStore.markProcessed(gameId, platformId);
		return true;
	}
}
