import API from './apis';
import dataStoreClient from './datastore/client';
import MatchListScraper from './scrapers/match-list';
import MatchDetailsScraper from './scrapers/match-details';

const MONGO_HOST = process.env.MONGO_HOST;
const MONGO_DB_NAME = 'lol-scrapped-data';
const REGIONS = { 0: 'EUN1', 1: 'EUW1', 2: 'NA1' };
const CURRENT_REGION = REGIONS[process.env.NODE_APP_INSTANCE] || REGIONS['0'];
const API_KEY = process.env.API_KEY;
const api = new API(API_KEY, CURRENT_REGION);

console.log('Using Region:', CURRENT_REGION);
const matchDetailsScraper = new MatchDetailsScraper(api, CURRENT_REGION);
const matchListScraper = new MatchListScraper(api, CURRENT_REGION);

async function main() {
	console.log('Connect to db');
	await dataStoreClient.connect(MONGO_HOST, MONGO_DB_NAME);
	console.log('Start match list scrapper');
	matchListScraper.start();
	console.log('Start match details scrapper');
	matchDetailsScraper.start();
}

main().catch(console.error);
