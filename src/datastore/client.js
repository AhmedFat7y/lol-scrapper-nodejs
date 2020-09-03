import { MongoClient } from 'mongodb';
export class DataStoreClient {
	isConnected() {
		return this.mongoClient.isConnected();
	}
	connect(host, dbName) {
		this.host = host;
		this.dbName = dbName;

		this.mongoClient = new MongoClient(`mongodb://${this.host}/${this.dbName}`);
		return this.mongoClient.connect();
	}
	get db() {
		if (!this.isConnected()) {
			throw new Error('Datastore Client is not connected');
		}
		return this.mongoClient.db(this.dbName);
	}
}

export default new DataStoreClient();
