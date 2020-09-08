import * as consts from '../constants';
import Logger from '../logger';

const logger = new Logger('Datstore');

class DataStoreBase {
	constructor(collectionName, idField, dataStoreClient) {
		this.dataStoreClient = dataStoreClient;
		this.collectionName = collectionName;
		this.idField = idField;
	}

	get collection() {
		return this.dataStoreClient.db.collection(this.collectionName);
	}

	updateWithID(id, update, extraQuery = {}) {
		return this.collection.updateOne({ [this.idField]: id, ...extraQuery }, { $set: update });
	}

	updateMany(query, update) {
		return this.collection.updateMany(query, update);
	}

	updateManyWithIDs(ids, update, extraQuery = {}) {
		return this.updateMany({ [this.idField]: { $in: ids }, ...extraQuery }, update);
	}

	find(id) {
		return this.collection.findOne({ [this.idField]: id });
	}

	saveMany(list) {
		list.forEach((i) => (i.state = consts.STATE_INITIAL));
		return this.collection.insertMany(list);
	}

	save(item) {
		item.state = consts.STATE_INITIAL;
		return this.collection.insertOne(item);
	}

	async checkExists(id, platformId) {
		const count = await this.collection.countDocuments({
			[this.idField]: id,
			platformId,
		});
		return count > 0;
	}

	resetProcessing() {
		return this.updateMany({ processing: consts.STATE_PROCESSING }, { processing: consts.STATE_INITIAL });
	}

	markProcessed(id, platformId) {
		return this.updateWithID(id, { state: consts.STATE_DONE }, { platformId });
	}

	markProcessing(id, platformId) {
		return this.updateWithID(id, { state: consts.STATE_PROCESSING }, { platformId });
	}

	findUnprocessedSingle(platformId) {
		return this.collection.findOne({
			state: consts.STATE_INITIAL,
			platformId,
		});
	}

	findInIdList(idsList, extraQuery = {}) {
		return this.collection.find({ [this.idField]: { $in: idsList }, ...extraQuery }).toArray();
	}
}

const timingWrapper = (funcName, func, _this) => {
	return (...args) => {
		const time = process.hrtime();
		let result = func.apply(_this, args);
		if (result && typeof result.then === 'function') {
			result = result
				.then((obj) => {
					const [seconds, nanos] = process.hrtime(time);
					const timeLapsed = seconds * 1000 + nanos / 1000000;
					if (timeLapsed > 1 * 1000) {
						logger.log('Time:', funcName, `${timeLapsed}`);
					}
					return obj;
				})
				.catch((err) => {
					throw err;
				});
		}
		return result;
	};
};

const dataStoreHandler = {
	get(target, property, receiver) {
		const func = Reflect.get(target, property, receiver);
		if (typeof func !== 'function') {
			return func;
		}
		return timingWrapper(property, func, receiver);
	},
};
const dataStoreClassHandler = {
	construct(target, argumentsList) {
		const instance = Reflect.construct(target, argumentsList);
		return new Proxy(instance, dataStoreHandler);
	},
};
export default new Proxy(DataStoreBase, dataStoreClassHandler);
