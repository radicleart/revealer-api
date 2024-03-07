import { sbtcContractEvents } from "../../lib/data/mongodb_connection.js";

export async function findContractEventsByPage(filter:any|undefined, page:number, limit:number):Promise<any> {
	return await sbtcContractEvents.find(filter).skip(page * limit).limit( limit ).sort({'payloadData.burnBlockHeight': -1, 'payloadData.txIndex': -1}).toArray();
}

export async function findContractEventsByFilter(filter:any|undefined) {
	return await sbtcContractEvents.find(filter).sort({'payloadData.burnBlockHeight': -1, 'payloadData.txIndex': -1}).toArray();
}

export async function countContractEvents () {
	return await sbtcContractEvents.countDocuments();
}

export async function saveNewContractEvent(newEvent:any) {
	const result = await sbtcContractEvents.insertOne(newEvent);
	return result;
}
