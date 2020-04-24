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

// async function generateSummoners(copyFrom, copyTo) {
// 	const matchesCursor = await copyFrom
// 		.collection('matches')
// 		.find(
// 			{ participantIdentities: { $exists: true } },
// 			{ participantIdentities: 1 }
// 		)
// 		.toArray();
// 	for (const match of matchesCursor) {
// 		// const match = await matchesCursor.next();
// 		const players = [];
// 		for (const participant of match.participantIdentities) {
// 			if (participant.currentAccountId === '0') {
// 				continue;
// 			}
// 			if (participant.player.platformId !== participant.player.currentPlatformId) {
// 				console.log('found extra one');
// 				players.push({
// 					accountId: participant.player.accountId,
// 					name: participant.player.summonerName,
// 					platformId: participant.player.platformId,
// 				});
// 			}
// 			players.push({
// 				accountId: participant.player.currentAccountId,
// 				name: participant.player.summonerName,
// 				platformId: participant.player.currentPlatformId,
// 			});
// 		}
// 		const existingPlayers = await copyTo
// 			.collection('summoners')
// 			.find({ accountId: { $in: players.map(i => i.accountId) } })
// 			.toArray();
// 		const existingPlayersIds = existingPlayers.map(i => i.accountId);
// 		const nonExistentPlayers = players.filter(
// 			player => !existingPlayersIds.includes(player.accountId)
// 		);
// 		if (nonExistentPlayers.length === 0) {
// 			continue;
// 		}
// 		try {
// 			await copyTo.collection('summoners').insertMany(nonExistentPlayers);
// 		} catch (error) {
// 			throw error;
// 		}
// 	}
// }

async function copyRegionQueryId(query, regionName, destinationCollection) {
	query.queryId = query.queryId.replace('--', `--platformId-${regionName}--`);

	delete query._id;
	try {
		await destinationCollection.insertOne(query);
	} catch (error) {
		if (error.code !== 11000) {
			throw error;
		} else {
			console.log('Ignore Duplicate:', query.queryId);
		}
	}
	return true;
}

async function* copyRegionQueryIdsGenerator(
	queriesCursor,
	regionName,
	destinationCollection
) {
	while (true) {
		yield queriesCursor.hasNext().then(async hasNext => {
			if (hasNext) {
				const query = await queriesCursor.next();
				return copyRegionQueryId(
					query,
					regionName,
					destinationCollection
				);
			} else {
				debugger;
				console.log('Done', regionName);
				return null;
			}
		});
	}
}

async function* cursorIter(cursor) {
	while (await cursor.hasNext()) {
		yield await cursor.next();
	}
}

function generateSummoners(match) {
	const players = [];
	for (const participant of match.participantIdentities) {
		if (participant.currentAccountId === '0') {
			continue;
		}
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
	return players;
}

function matchesIterateeWrapper(destinationCollection) {
	return async function cursorIteratee(match) {
		const players = generateSummoners(match);
		const existingPlayers = await destinationCollection
			.find({ accountId: { $in: players.map(i => i.accountId) } })
			.toArray();
		const nonExistentPlayers = players.filter(
			player =>
				!existingPlayers.find(
					existingPlayer =>
						existingPlayer.platformId === player.platformId &&
						existingPlayer.accountId === player.accountId
				)
		);
		if (!nonExistentPlayers.length) {
			return true;
		}
		try {
			await destinationCollection.insertMany(nonExistentPlayers);
		} catch (error) {
			if (error.code !== 11000) {
				throw error;
			} else {
				// console.log('Retrying for duplicate', error.errmsg);
				return cursorIteratee(match);
			}
		}
	};
}

async function addExtraSummoners(regionClient, destinationclient) {
	const matchesCollection = regionClient.db.collection('matches');
	const destinationCollection = destinationclient.db.collection('summoners');
	const matchesCursor = await matchesCollection.find(
		{ participantIdentities: { $exists: true } },
		{ participantIdentities: 1, gameId: 1 }
	);
	await Async.eachLimit(
		cursorIter(matchesCursor),
		10,
		matchesIterateeWrapper(destinationCollection)
	);
}

function summonersIterateeWrapper(destinationCollection) {
	return async function cursorIteratee(summoner) {
		const result = await destinationCollection.updateOne(
			{
				accountId: summoner.accountId,
				platformId: summoner.platformId,
			},
			{ $set: { state: summoner.state } }
		);
		if (result.modifiedCount !== 1) {
			console.log('Failed:', summoner);
			debugger;
		}
	};
}

async function updateSummonerStatus(regionClient, destinationClient) {
	const summonersCollection = regionClient.db.collection('summoners');
	const destinationCollection = destinationClient.db.collection('summoners');
	const summonersCursor = await summonersCollection.find({
		state: { $ne: 'initial' },
	});
	await destinationCollection.updateMany({}, { $set: { state: 'initial' } });
	await Async.eachLimit(
		cursorIter(summonersCursor),
		10,
		summonersIterateeWrapper(destinationCollection)
	);
}

function matchlistqueryIterateeWrapper(collection) {
	return async function cursorIteratee(matchlistquery) {
		const platformId = matchlistquery.queryId.match(/platformId-(.*)--/)[1];
		const newQueryId = matchlistquery.queryId.replace(
			/platformId-(.*)--/,
			(match, platformId) =>
				'platformId-' + platformId.toUpperCase() + '--'
		);
		const result = await collection.updateOne(
			{ _id: matchlistquery._id },
			{
				$set: {
					queryId: newQueryId,
					platformId: platformId.toUpperCase(),
				},
			}
		);
		if (result.modifiedCount !== 1) {
			console.log('Failed:', matchlistquery);
			debugger;
		}
	};
}

async function addPlatformId(client) {
	const matchlistqueryCollection = client.db.collection('matchlistquery');
	const cursor = matchlistqueryCollection.find({});
	await Async.eachLimit(
		cursorIter(cursor),
		30,
		matchlistqueryIterateeWrapper(matchlistqueryCollection)
	);
}

async function main() {
	await defaultClient.connect(MONGO_HOST, MONGO_DB_NAME);
	// const summonersCollection = defaultClient.db.collection('summoners');
	// await summonersCollection.createIndex(
	// 	{ accountId: 1, platformId: 1 },
	// 	{ unique: true }
	// );
	// const regionsClients = {};
	// for (const region of REGIONS) {
	// 	const regionClient = new DataStoreClient();
	// 	await regionClient.connect(MONGO_HOST, `${region}-${MONGO_DB_NAME}`);
	// 	regionsClients[region] = regionClient;
	// }

	// const summonersPromises = [];
	// for (const region of REGIONS) {
	// 	summonersPromises.push(
	// 		addExtraSummoners(regionsClients[region], defaultClient)
	// 	);
	// }
	// await Promise.all(summonersPromises);

	// const updatesPromises = [];
	// for (const region of REGIONS) {
	// 	updatesPromises.push(
	// 		updateSummonerStatus(regionsClients[region], defaultClient)
	// 	);
	// }
	// await Promise.all(updatesPromises);
	await addPlatformId(defaultClient);
	return true;
}

main()
	.catch(error => console.error(error))
	.then(() => console.log('Done'))
	.finally(() => process.exit());
