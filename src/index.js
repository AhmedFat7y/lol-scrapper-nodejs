import API from './apis';
import dataStoreClient from './datastore/client';
import MatchListScraper from './scrapers/match-list';
import MatchDetailsScraper from './scrapers/match-details';
import { CURRENT_REGION, API_KEY, MONGO_HOST, MONGO_DB_NAME } from './config';
import Logger from './logger';

const logger = new Logger('main');

const api = new API(API_KEY, CURRENT_REGION);

logger.log('Using Region:', CURRENT_REGION);

const matchDetailsScraper = new MatchDetailsScraper(api, CURRENT_REGION);
const matchListScraper = new MatchListScraper(api, CURRENT_REGION);

async function main() {
	logger.log('Connect to db');
	await dataStoreClient.connect(MONGO_HOST, MONGO_DB_NAME);
	logger.log('Start match list scrapper');
	matchListScraper.start();
	logger.log('Start match details scrapper');
	matchDetailsScraper.start();
}

main().catch(logger.error.bind(logger));
