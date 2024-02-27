import { ObjectId } from 'mongodb';
import { commitmentCollection } from '../../lib/data/mongodb_connection';
import { CommitmentStatus } from '../../types/revealer_types';
  
// Exchange Rates 
export async function saveCommitment (commitment:any) {
	const result = await commitmentCollection.insertOne(commitment);
	return result;
}

export async function updateCommitment (pegger:any, changes: any) {
	const result = await commitmentCollection.updateOne({
		_id: pegger._id
	},
    { $set: changes});
	return result;
}

export async function findCommitmentsByFilter(filter:any|undefined):Promise<any> {
	const result = await commitmentCollection.find(filter).sort({'updated': 1}).toArray();
	return result;
}

export async function findCommitmentById(_id:string):Promise<any> {
	let o_id = new ObjectId(_id);   // id as a string is passed
	const result = await commitmentCollection.findOne({"_id":o_id});
	return result;
}

export async function findCommitmentByPaymentAddress(paymentAddress:string):Promise<any> {
	const result = await commitmentCollection.findOne({"paymentAddress":paymentAddress});
	return result;
}

export async function findCommitmentsPendingByOriginator(originator:string, requestType:string):Promise<any> {
	const result = await commitmentCollection.findOne({"originator":originator, "status": CommitmentStatus.UNPAID, 'requestType': requestType});
	return result;
}

