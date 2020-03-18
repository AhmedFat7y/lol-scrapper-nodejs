export default class Utils {
	static calculateMatchListQueryId(accountId, query) {
		return Object.entries({ accountId, ...query })
			.map(entry => entry.join('-'))
			.join('--');
	}
}
