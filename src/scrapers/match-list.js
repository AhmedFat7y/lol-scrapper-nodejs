import ScraperBase from './base';
import { SummonerDataStore, MatchDataStore, MatchListQueryDataStore } from '../datastore';
import Utils from '../utils';
import Logger from '../logger';

const logger = new Logger('match-list');

export default class MatchListScraper extends ScraperBase {
	async initialize() {
		await SummonerDataStore.resetProcessing();
	}

	async execute() {
		const summoner = await SummonerDataStore.findUnprocessedSingle(this.region);
		if (!summoner) {
			logger.log('No summoner found');
			return false;
		}
		const { accountId, name, platformId } = summoner;

		if (accountId === name) {
			await SummonerDataStore.markProcessed(accountId, platformId);
			return true;
		}
		let beginIndex = 0;
		let moreGamesExist = true;
		do {
			const query = { beginIndex };
			const matchlistQueryId = Utils.calculateMatchListQueryId(accountId, platformId, query);

			const exists = await MatchListQueryDataStore.checkExists(matchlistQueryId, platformId);
			if (exists) {
				logger.log('Query ID exists:', matchlistQueryId);
				beginIndex += 100;
				continue;
			}
			logger.log('Fetch match list for summoner:', name, 'Starting:', beginIndex);
			const matchListResult = await this.apis.getMatchList({
				accountId,
				region: platformId,
				query,
			});

			if (!matchListResult) {
				await SummonerDataStore.markProcessed(accountId, platformId);
				return true;
			}

			const { endIndex, totalGames, matches } = matchListResult;
			const existingMatchesList = await MatchDataStore.findInIdList(matches.map((match) => match.gameId));
			const nonExistMatches = Utils.filterExistingItems(matches, existingMatchesList, 'gameId');
			if (nonExistMatches && nonExistMatches.length) {
				logger.log('Saving', nonExistMatches.length, 'matches from', matches.length, 'matches');
				await MatchDataStore.saveMany(nonExistMatches);
			}
			await MatchListQueryDataStore.save({
				queryId: matchlistQueryId,
				platformId,
				query,
			});
			moreGamesExist = endIndex < totalGames;
			beginIndex = endIndex;
			await Utils.delay(2 * 1000);
		} while (moreGamesExist);
		await SummonerDataStore.markProcessed(accountId, platformId);
		return true;
	}
}
