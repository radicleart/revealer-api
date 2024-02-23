import { transactionCollection } from '../../lib/data/mongodb_connection';
import { RevealerTransaction } from '../../types/revealer_types';


export async function updateDeposit(newTxId:string, oldTxId:string, signedPsbtHex?:string): Promise<RevealerTransaction> {
  try {
    await updateTransaction(oldTxId, {
      txId: newTxId,
      psbt: signedPsbtHex, 
      confirmations:-1, 
      signed:true, 
      updated: new Date().getTime()
    });
    const revealerTx = await findTransactionByTxId(newTxId) as RevealerTransaction;
    return revealerTx;
  } catch (err:any) {
    console.error('updateDeposit: error: ', err)
    throw new Error('Broadcast error: ' + err.message)
  }
}

export async function updateDepositForSuccessfulBroadcast(txId:string): Promise<RevealerTransaction> {
  try {
    await updateTransaction(txId, {
      confirmations:0, 
      updated: new Date().getTime()
    });
    const revealerTx = await findTransactionByTxId(txId) as RevealerTransaction;
    return revealerTx;
  } catch (err:any) {
    console.error('updateDeposit: error: ', err)
    throw new Error('Broadcast error: ' + err.message)
  }
}

export async function saveTransaction (revealerTx:any) {
	const result = await transactionCollection.insertOne(revealerTx);
	return result;
}

export async function updateTransaction (txId:string, changes: any) {
	const result = await transactionCollection.updateOne({
		txId
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


