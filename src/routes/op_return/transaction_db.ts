import { ObjectId, OptionalId, OptionalUnlessRequiredId } from 'mongodb';
import { transactionCollection } from '../../lib/data/mongodb_connection';
import { RevealerTransaction } from '../../types/revealer_types';
  
// Exchange Rates 
export async function saveTransaction (revealerTx:OptionalId<RevealerTransaction>) {
	const result = await transactionCollection.insertOne(revealerTx);
	return result;
}

export async function updateTransaction (revealerTx:RevealerTransaction, changes: any) {
	const result = await transactionCollection.updateOne({
		_id: revealerTx._id
	},
    { $set: changes});
	return result;
}

export async function findTransactionsByFilter(filter:any|undefined):Promise<any> {
	const result = await transactionCollection.find(filter).sort({'updated': 1}).toArray();
	return result;
}

export async function findTransactionByTxId(txId:string):Promise<any> {
	const result = await transactionCollection.findOne({"txId":txId});
	return result;
}

export async function findTransactionByPaymentAddress(paymentAddress:string):Promise<any> {
	const result = await transactionCollection.findOne({"paymentAddress":paymentAddress});
	return result;
}


