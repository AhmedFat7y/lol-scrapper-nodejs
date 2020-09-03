export const MONGO_HOST = process.env.MONGO_HOST;
export const MONGO_DB_NAME = 'lol-scrapped-data';
export const REGIONS = { 0: 'EUN1', 1: 'EUW1', 2: 'NA1' };
export const CURRENT_REGION = REGIONS[process.env.NODE_APP_INSTANCE] || REGIONS['0'];
export const API_KEY = process.env.API_KEY;
