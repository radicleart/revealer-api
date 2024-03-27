import { MongoClient, ServerApiVersion } from 'mongodb';
import type { Collection } from 'mongodb';
import { getConfig } from '../config.js';

export let transactionCollection:Collection;
export let exchangeRatesCollection:Collection;
export let sbtcContractEvents:Collection;

export async function connect() {
	let uriPrefix:string = 'mongodb+srv'
	const environ = process.env.NODE_ENV;
	if (environ && environ === 'local-devnet') {
	  // SRV URIs have the additional security requirements on hostnames.
	  // A FQDN is not required for development.
	  uriPrefix = 'mongodb'
	}
	const uri = `${uriPrefix}://${getConfig().mongoUser}:${getConfig().mongoPwd}@${getConfig().mongoDbUrl}/${getConfig().mongoDbName}?retryWrites=true&w=majority`;
	//console.log("Mongo: " + uri);

	// The MongoClient is the object that references the connection to our
	// datastore (Atlas, for example)
	const client = new MongoClient(uri, {
		serverApi: {
		  version: ServerApiVersion.v1,
		  strict: true,
		  deprecationErrors: true,
		}
	});
	
	// The connect() method does not attempt a connection; instead it instructs
	// the driver to connect using the settings provided when a connection
	// is required.
	await client.connect();
	await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
	
	// Create references to the database and collection in order to run
	// operations on them.
	const database = client.db(getConfig().mongoDbName);
	
	exchangeRatesCollection = database.collection('exchangeRatesCollection');
	await exchangeRatesCollection.createIndex({currency: 1}, { unique: true })

	transactionCollection = database.collection('transactionCollection');
	await transactionCollection.createIndex({txId: 1}, { unique: true })

	sbtcContractEvents = database.collection('sbtcContractEvents');
	await sbtcContractEvents.createIndex({'contractId': 1, 'txid': 1}, { unique: true })

}
