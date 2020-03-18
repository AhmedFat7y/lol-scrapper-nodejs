import ScraperBase from './base';
import {
	SummonerDataStore,
	MatchDataStore,
	MatchListQueryDataStore,
} from '../datastore';

import Utils from '../utils';

export default class MatchListScraper extends ScraperBase {
	async initialize() {
		await SummonerDataStore.resetProcessing();
		const summoner = await SummonerDataStore.findUnprocessedSingle();
		this.summonersQueue.push(summoner);
	}

	async execute() {
		await this.matchlistPromise;
		const summoner = await SummonerDataStore.findUnprocessedSingle();
		if (!summoner) {
			console.log('No summoner found');
			return false;
		}
		const { accountId, name } = summoner;
		let beginIndex = 0;
		let moreGamesExist = true;
		do {
			const query = { beginIndex };
			const matchlistQueryId = Utils.calculateMatchListQueryId(
				accountId,
				query
			);

			const exists = await MatchListQueryDataStore.checkExists(
				matchlistQueryId
			);
			if (exists) {
				console.log('Query ID exists:', queryId);
				beginIndex += 100;
				continue;
			}
			console.log(
				'Fetch match list for summoner:',
				name,
				'Starting:',
				beginIndex
			);

			const matchListResult = await this.apis.getMatchList(
				accountId,
				query
			);
			const { endIndex, totalGames, matches } = matchListResult;
			const existingMatchesList = await MatchDataStore.findInIdList(
				matches.map(match => match.gameId)
			);
			const nonExistMatches = Utils.filterExistingItems(
				matches,
				existingMatchesList,
				"gameId"
			);
			if (nonExistMatches && nonExistMatches.length) {
				console.log(
					'Saving',
					nonExistMatches.length,
					'matches from',
					matches.length,
					'matches'
				);
				try {
					await MatchDataStore.saveMany(nonExistMatches);
				} catch (error) {
					console.error(error);
					debugger;
				}
			}
			await MatchListQuMatchListQueryDataStore.save({
				queryId: matchlistQueryId,
				query,
			});
			moreGamesExist = endIndex < totalGames;
			beginIndex = endIndex;
		} while (moreGamesExist);
		await SummonerDataStore.markProcessed(accountId);
		return true;
	}
}
