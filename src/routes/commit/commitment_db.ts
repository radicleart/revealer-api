import { ObjectId } from 'mongodb';
import { commitments } from '../../lib/data/mongodb_connection';
  
// Exchange Rates 
export async function saveCommitment (commitment:any) {
	const result = await commitments.insertOne(commitment);
	return result;
}

export async function updateCommitment (pegger:any, changes: any) {
	const result = await commitments.updateOne({
		_id: pegger._id
	},
    { $set: changes});
	return result;
}

export async function findCommitmentsByFilter(filter:any|undefined):Promise<any> {
	const result = await commitments.find(filter).sort({'updated': 1}).toArray();
	return result;
}

export async function findCommitmentById(_id:string):Promise<any> {
	let o_id = new ObjectId(_id);   // id as a string is passed
	const result = await commitments.findOne({"_id":o_id});
	return result;
}

export async function findCommitmentByPaymentAddress(paymentAddress:string):Promise<any> {
	const result = await commitments.findOne({"paymentAddress":paymentAddress});
	return result;
}

