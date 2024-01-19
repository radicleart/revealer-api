import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';
import type { Collection } from 'mongodb';
import { getConfig } from '../config.js';
import { LockResponse, QuoteI } from '../../types/loans.js';

let requestForQuotes:Collection;
let lockResponses:Collection;
let customers:Collection;
let allowlist:Collection;
let uasuDLCEvents:Collection;

  
export async function connect() {
	const uri = `mongodb+srv://${getConfig().mongoUser}:${getConfig().mongoPwd}@${getConfig().mongoDbUrl}/?retryWrites=true&w=majority`;
	console.log("Mongo: " + uri);
	console.log("Mongo db: " + getConfig().mongoDbName);

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
	lockResponses = database.collection('lockResponses');
	await lockResponses.createIndex({txId: 1}, { unique: true })
	requestForQuotes = database.collection('requestForQuotes');
	await requestForQuotes.createIndex({originator: 1, strikePriceUsd: 1, collateralBtc: 1, premiumBtc: 1, product: 1}, { unique: true })
	customers = database.collection('customers');
	await customers.createIndex({email_address: 1}, { unique: true })
	allowlist = database.collection('allowlist');
	await allowlist.createIndex({address: 1}, { unique: true });
	uasuDLCEvents = database.collection('uasuDLCEvents');
	await uasuDLCEvents.createIndex({'event-source': 1, uuid: 1 }, { unique: true });
}

// DLC Events
export async function saveNewDLCEvent(newEvent:any) {
	const result = await uasuDLCEvents.insertOne(newEvent);
	return result;
}
export async function addLockResponse (lockResponse:LockResponse) {
	try {
		return await lockResponses.insertOne(lockResponse);
	} catch (err:any) {
		console.error('lockResponse: ' + err.message)
	}
}
export async function getLockResponses (stacksAddress:string) {
	const result = await lockResponses.find({ stacksAddress }).toArray();
	return result;
}
export async function getLockResponse (uuid:string) {
	const result = await lockResponses.findOne({ uuid });
	return result;
}



// Exchange Rates 
export async function addRequestForQuote (requestForQuote:any) {
	try {
		return await requestForQuotes.insertOne(requestForQuote);
	} catch (err:any) {
		console.error('addRequestForQuote: ' + err.message)
	}
}

export async function updateRequestForQuote (quote:QuoteI) {
	const up = {
		alicePubKeys: quote.alicePubKeys,
		bobPubKeys: quote.bobPubKeys,
		commitment:quote.commitment,
		originator: quote.originator,
		updated:quote.updated,
		type:quote.type,
		product:quote.product,
		expiration:quote.expiration,
		expirationBH:quote.expirationBH,
		strikePriceUsd:quote.strikePriceUsd,
		maxInsurance: quote.maxInsurance,
		collateralBtc: quote.collateralBtc,
		premiumBtc:quote.premiumBtc,
		dlEscrowCall1: quote.dlEscrowCall1,
		acceptPSBTHex: quote.acceptPSBTHex,
		acceptPSBTHexAlice: quote.acceptPSBTHexAlice,
		acceptPSBTHexBob: quote.acceptPSBTHexBob,
		acceptPSBTHexAliceDecoded: quote.acceptPSBTHexAliceDecoded,
		acceptPSBTHexBobDecoded: quote.acceptPSBTHexBobDecoded,
		acceptTxId: quote.acceptTxId,
		acceptTxError: quote.acceptTxError,
		contracts: quote.contracts
	}

	const result = await requestForQuotes.updateOne({
		_id: new ObjectId(quote._id)
	},
    { $set: up});
	return result;
}

export async function getRequestForQuotes () {
	const result = await requestForQuotes.find({}).sort({'updated': -1}).toArray();
	return result;
}

export async function getRequestForQuotesByOriginator (originator:string) {
	const result = await requestForQuotes.find({ originator }).sort({'updated': -1}).toArray();
	return result;
}

export async function getRequestForQuote (id:string) {
	let o_id = new ObjectId(id);   // id as a string is passed
	const result = await requestForQuotes.findOne({"_id":o_id});
	return result;
}

export async function addCustomer (customer:any) {
	 await customers.insertOne(customer);
}

export async function addAddressToAllowlist(allowlistRequest: any) {
	return await allowlist.insertOne(allowlistRequest);

}

export async function addManyAddressesToAllowlist(allowlistRequests: any) {
	return await allowlist.insertMany(allowlistRequests);

}

export async function isAllowlisted(address:string): Promise<boolean> {
	const foundAddress = await allowlist.findOne({address:address})
	return foundAddress !== null
}

// export async function removeAddressFromAllowlist(allowlistRequest:any) {
// 	const o_id = await allowlist.find({address:allowlistRequest.address})
// 	return await allowlist.deleteOne({_id: new ObjectId(o_id._id.str)})
// }
