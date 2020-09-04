import ScraperBase from './base';
import Utils from '../utils';
import { SummonerDataStore, MatchDataStore, MatchTimelineDatastore } from '../datastore';
import Logger from '../logger';

const logger = new Logger('match-details');

export default class MatchDetailsScraper extends ScraperBase {
	async initialize() {
		await MatchDataStore.resetProcessing();
	}
	/**
	 * @deprecated
	 */
	async execute() {
		const match = await MatchDataStore.findUnprocessedSingle(this.region);
		if (!match) {
			logger.log('No Match Found for region:', this.region);
			return false;
		}
		let { gameId, participantIdentities, platformId } = match;
		if (!participantIdentities) {
			logger.log('Fetch Details for Match:', gameId);
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
				participant.player.platformId !== participant.player.currentPlatformId &&
				participant.player.accountId !== participant.player.currentAccountId
			) {
				players.push({
					accountId: participant.player.accountId,
					name: participant.player.summonerName,
					platformId: participant.player.platformId,
				});
			}
			// to get over champions like ashe and others considered as players with id 0
			if (participant.player.currentAccountId === '0') {
				participant.player.currentAccountId = participant.player.summonerName;
			}
			players.push({
				accountId: participant.player.currentAccountId,
				name: participant.player.summonerName,
				platformId: participant.player.currentPlatformId,
			});
		}
		let didSaveSummoners;
		do {
			didSaveSummoners = true;
			logger.log('Trying to save summoners');
			const existingPlayers = await SummonerDataStore.findInIdList(players.map((player) => player.accountId));
			const nonExistPlayers = Utils.filterExistingItems(players, existingPlayers, 'accountId');
			if (nonExistPlayers.length > 0) {
				logger.log('Saving', nonExistPlayers.length, 'summoners from', players.length, 'summoners');
				try {
					await SummonerDataStore.saveMany(nonExistPlayers);
				} catch (err) {
					logger.error({
						players: participantIdentities.map((i) => i.player),
						nonExistPlayers,
						existingPlayers,
					});
					logger.error('Error Saving summoners:', err);
					didSaveSummoners = false;
				}
			}
		} while (!didSaveSummoners);
		const matchTimelineExists = await MatchTimelineDatastore.checkExists(gameId, platformId);
		if (!matchTimelineExists) {
			logger.log('Fetch timeline for Match:', gameId);
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
