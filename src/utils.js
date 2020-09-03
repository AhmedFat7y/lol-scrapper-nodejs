export default class Utils {
	static calculateMatchListQueryId(accountId, platformId, query) {
		return Object.entries({ accountId, platformId, ...query })
			.map((entry) => entry.join('-'))
			.join('--');
	}

	static filterExistingItems(allItems, existingItems, idKey = '_id') {
		if (!existingItems || !existingItems.length) {
			return allItems;
		}
		return allItems.filter(
			(item) =>
				!existingItems.find(
					(existingItem) => item[idKey] === existingItem[idKey] && existingItem.platformId === item.platformId
				)
		);
	}

	static delay(ms) {
		return new Promise((resolve) => {
			setTimeout(resolve, ms);
		});
	}
}
