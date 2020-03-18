import _dataStoreClient from './client';
import * as consts from '../constants';

export default class DataStoreBase {
	constructor(collectionName, idField, dataStoreClient) {
		this.dataStoreClient = dataStoreClient;
		this.collectionName = collectionName;
		this.idField = idField;
	}

	get collection() {
		return this.dataStoreClient.db.collection(this.collectionName);
	}

	updateWithID(id, update) {
		this.collection.update({ [this.idField]: id }, { $set: update });
	}

	updateMany(query, update) {
		this.collection.update(query, { $set: update });
	}

	find(id) {
		return this.collection.findOne({ [this.idField]: id });
	}

	saveMany(list) {
		list.forEach(i => (i.state = consts.STATE_INITIAL));
		return this.collection.insertMany(list);
	}

	save(item) {
		item.state = consts.STATE_INITIAL;
		return this.collection.insert(item);
	}

	checkExists(id) {
		const count = this.collection.countDocuments({ [this.idField]: id });
		return count > 0;
	}

	resetProcessing() {
		return this.updateMany(
			{ processing: consts.STATE_PROCESSING },
			{ processing: consts.STATE_INITIAL }
		);
	}

	markProcessed(id) {
		return this.updateWithID(id, { state: consts.STATE_DONE });
	}

	markProcessing(id) {
		return this.updateWithID(id, { state: consts.STATE_PROCESSING });
	}
	findUnprocessedSingle() {
		return this.collection.findOne({ state: consts.STATE_INITIAL });
	}
}
