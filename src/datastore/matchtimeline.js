import * as consts from '../constants';
import dataStoreClient from './client';
import Base from './base';

class MatchTimeline extends Base {}

export default new MatchTimeline(consts.MATCH_TIMELINE, 'matchId', dataStoreClient);
