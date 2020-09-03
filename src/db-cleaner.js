import { Client, SummonerDataStore, MatchDataStore, MatchListQueryDataStore } from './datastore';

import client, { DataStoreClient } from './datastore/client';

const REGIONS = ['eun1', 'euw1', 'na1'];

const MONGO_HOST = 'localhost';
const MONGO_DB_NAME = 'lol-scrapped-data';
const defaultDB = new DataStoreClient();

async function copyCollection(collectionName, copyFrom, copyTo) {
	const cursor = await copyFrom.collection(collectionName).find({});
	while (await cursor.hasNext()) {
		const item = await cursor.next();
		delete item._id;
		try {
			await copyTo.collection(collectionName).insertOne(item);
		} catch (error) {
			if (error.code !== 11000) {
				throw error;
			} else {
				logger.log('Ignore Duplicate:', item.gameId, item.platformId);
			}
		}
	}
}

async function main() {
	await defaultDB.connect(MONGO_HOST, MONGO_DB_NAME);
	const matchesCollection = defaultDB.db.collection('matches');
	const promsies = [];
	await matchesCollection.createIndex({ gameId: 1 }, { unique: true });
	for (const region of REGIONS) {
		const regionDB = new DataStoreClient();
		await regionDB.connect(MONGO_HOST, `${region}-${MONGO_DB_NAME}`);
		promsies.push(copyCollection('matches', regionDB.db, defaultDB.db));
	}
	await Promise.all(promsies);
}

main()
	.catch(logger.error.bind(logger))
	.finally(() => process.exit());
