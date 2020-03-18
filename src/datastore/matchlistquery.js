import * as consts from '../constants';
import dataStoreClient from './client';
import Base from './base';

class MatchListQuery extends Base {}

export default new MatchListQuery(consts.MATCH_LIST_QUERY, 'queryId', dataStoreClient);
