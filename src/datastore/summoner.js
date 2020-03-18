import * as consts from '../constants';
import dataStoreClient from './client';
import Base from './base';

class Summoner extends Base {}

export default new Summoner(consts.SUMMONER, 'accountId', dataStoreClient);
