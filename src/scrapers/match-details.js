import ScraperBase from './base';
import Utils from '../utils';
import { SummonerDataStore, MatchDataStore, MatchTimelineDatastore } from '../datastore';
import Logger from '../logger';
import { STATE_DONE } from '../constants';

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
			logger.log('Fetch Details for Match:', platformId, gameId);
			const matchDetails = await this.apis.getMatchDetails({
				gameId,
				region: platformId,
			});
			if (!matchDetails) {
				await MatchDataStore.markProcessed(gameId, platformId);
				logger.error('No match details found for', gameId, platformId);
				return true;
			}
			participantIdentities = matchDetails.participantIdentities;
			await MatchDataStore.updateWithID(gameId, matchDetails, { platformId });
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
				participant.state = STATE_DONE;
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
			logger.log('Fetch timeline for Match:', platformId, gameId);
			const timeline = await this.apis.getMatchTimeline({
				gameId,
				region: platformId,
			});
			if (!timeline) {
				logger.error('No timeline found for:', gameId, platformId);
				await MatchDataStore.markProcessed(gameId, platformId);
				return true;
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
