import Async from 'async';
import Utils from './utils';
import {
	Client,
	SummonerDataStore,
	MatchDataStore,
	MatchListQueryDataStore,
} from './datastore';

import { DataStoreClient } from './datastore/client';

const REGIONS = ['eun1', 'euw1', 'na1'];

const MONGO_HOST = 'localhost';
const MONGO_DB_NAME = 'lol-scrapped-data';
const defaultClient = new DataStoreClient();

async function generateSummoners(copyFrom, copyTo) {
	const matchesCursor = await copyFrom
		.collection('matches')
		.find({ participantIdentities: { $exists: true } }, { participantIdentities: 1 })
		.toArray();
	for (const match of matchesCursor) {
		// const match = await matchesCursor.next();
		const players = [];
		for (const participant of match.participantIdentities) {
			if (participant.currentAccountId === '0') {
				continue;
			}
			if (participant.platformId !== participant.currentPlatformId) {
				logger.log('found extra one');
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
		const existingPlayers = await copyTo
			.collection('summoners')
			.find({ accountId: { $in: players.map((i) => i.accountId) } })
			.toArray();
		const existingPlayersIds = existingPlayers.map((i) => i.accountId);
		const nonExistentPlayers = players.filter((player) => !existingPlayersIds.includes(player.accountId));
		if (nonExistentPlayers.length === 0) {
			continue;
		}
		try {
			await copyTo.collection('summoners').insertMany(nonExistentPlayers);
		} catch (error) {
			throw error;
		}
	}
}

async function copyRegionQueryId(query, regionName, destinationCollection) {
	query.queryId = query.queryId.replace('--', `--platformId-${regionName}--`);

	delete query._id;
	try {
		await destinationCollection.insertOne(query);
	} catch (error) {
		if (error.code !== 11000) {
			throw error;
		} else {
			logger.log('Ignore Duplicate:', query.queryId);
		}
	}
	return true;
}

async function* copyRegionQueryIdsGenerator(queriesCursor, regionName, destinationCollection) {
	while (true) {
		yield queriesCursor.hasNext().then(async (hasNext) => {
			if (hasNext) {
				const query = await queriesCursor.next();
				return copyRegionQueryId(query, regionName, destinationCollection);
			} else {
				logger.log('Done', regionName);
				return null;
			}
		});
	}
}

async function* queriesIter(queriesCursor) {
	while (await queriesCursor.hasNext()) {
		yield await queriesCursor.next();
	}
}

function copyRegionQueryIdsGenerator2(regionName, destinationCollection) {
	return async function (query) {
		// logger.log('Copying:', regionName, query);
		return copyRegionQueryId(query, regionName, destinationCollection);
	};
}

async function fixRegionQueries(regionClient, destinationclient, regionName) {
	const queriesCollection = regionClient.db.collection('matchlistquery');
	const destinationCollection = destinationclient.db.collection('matchlistquery');
	const queriesCursor = await queriesCollection.find({});
	await Async.eachLimit(
		queriesIter(queriesCursor),
		10,
		copyRegionQueryIdsGenerator2(regionName, destinationCollection)
	);
	// const pool = new PromisePool(
	// 	copyRegionQueryIdsGenerator2(
	// 		queriesCursor,
	// 		regionName,
	// 		destinationCollection
	// 	),
	// 	10
	// );
	// await pool.start();
}

async function main() {
	const promises = [];
	await defaultClient.connect(MONGO_HOST, MONGO_DB_NAME);
	const matchlistqueryCollection = defaultClient.db.collection('matchlistquery');
	await matchlistqueryCollection.createIndex({ queryId: 1 }, { unique: true });
	for (const region of REGIONS) {
		const regionClient = new DataStoreClient();
		await regionClient.connect(MONGO_HOST, `${region}-${MONGO_DB_NAME}`);
		promises.push(await fixRegionQueries(regionClient, defaultClient, region));
	}
	return Promise.all(promises);
}

main()
	.catch((error) => logger.error(error))
	.then(() => logger.log('Done'))
	.finally(() => process.exit());
