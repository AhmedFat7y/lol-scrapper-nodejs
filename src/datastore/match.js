import * as consts from '../constants';
import dataStoreClient from './client';
import Base from './base';

class Match extends Base {}

export default new Match(consts.MATCH, 'gameId', dataStoreClient);
