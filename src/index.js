import API from './apis';
import dataStoreClient from './datastore/client';
import MatchListScraper from './scrapers/match-list';
import MatchDetailsScraper from './scrapers/match-details';

const MONGO_HOST = 'localhost';
const MONGO_DB_NAME = 'lol-scrapped-data';
const REGIONS = { '0': 'eun1', '1': 'euw1', '2': 'na1' };
const CURRENT_REGION = REGIONS[process.env.NODE_APP_INSTANCE] || REGIONS['0'];
const API_KEY = 'RGAPI-d187e0fd-7dcf-4f30-8c14-12099928353e';
const api = new API(API_KEY, CURRENT_REGION);

console.log('Using Region:', CURRENT_REGION);
const matchDetailsScraper = new MatchDetailsScraper(api);
const matchListScraper = new MatchListScraper(api);

async function main() {
	console.log('Connect to db');
	await dataStoreClient.connect(
		MONGO_HOST,
		`${CURRENT_REGION}-${MONGO_DB_NAME}`
	);
	console.log('Start match list scrapper');
	matchListScraper.start();
	console.log('Start match details scrapper');
	matchDetailsScraper.start();
}

main().catch(console.error);
