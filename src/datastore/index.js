import * as consts from '../constants';

import Summoner from './summoner';
import Match from './match';
import MatchListQuery from './matchlistquery';
import MatchTimeline from './matchtimeline';

export { default as Client } from './client';
export { default as SummonerDataStore } from './summoner';
export { default as MatchDataStore } from './match';
export { default as MatchListQueryDataStore } from './matchlistquery';
export { default as MatchTimelineDatastore } from './matchtimeline';

export const ENTITIES_MAP = {
	[consts.MATCH]: Match,
	[consts.MATCH_LIST_QUERY]: MatchListQuery,
	[consts.MATCH_TIMELINE]: MatchTimeline,
	[consts.SUMMONER]: Summoner,
};
