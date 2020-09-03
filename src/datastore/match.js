import * as consts from '../constants';
import dataStoreClient from './client';
import Base from './base';

class Match extends Base {
	addSummonerToMatches(matchesIds, accountId) {
		return this.updateManyWithIDs(matchesIds, {
			$addToSet: { summoners: accountId },
		});
	}
}

export default new Match(consts.MATCH, 'gameId', dataStoreClient);
