import { transactionCollection } from '../../lib/data/mongodb_connection.js';
import { CommitmentStatus, OpDropRequest, OpReturnRequest, PSBTHolder, RevealerTransaction, RevealerTxModes, RevealerTxTypes } from '../../types/revealer_types.js';
import { CommitmentScriptDataType } from '../../types/sbtc_types.js';


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
      status: CommitmentStatus.PENDING, 
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
	const result = await transactionCollection.updateOne({txId},{ $set: changes});
	return result;
}

export async function countTransactionsByFilter(filter:any|undefined):Promise<number> {
	const result = await transactionCollection.countDocuments(filter);
	return result;
}

export async function findTransactionsByFilter(filter:any|undefined, page:number, limit:number, sorter:string|number):Promise<Array<any>> {
	const result = await transactionCollection.find(filter).sort({sorter: 1}).skip(page * limit).limit( limit ).toArray();
	return result;
}

export async function findTransactionByTxId(txId:string):Promise<any> {
	const result = await transactionCollection.findOne({"txId":txId});
	return result;
}

export async function findOldestTransactionByHeight():Promise<any> {
	const result = await transactionCollection.find({blockHeight: {$exists: true}}).sort({blockHeight:-1}).limit(1).toArray()
	return result;
}

export async function findTransactionByCommitAddress(address:string):Promise<any> {
	const result = await transactionCollection.findOne({"commitment.address":address});
	return result;
}

export async function findTransactionByPaymentAddress(paymentAddress:string):Promise<any> {
	const result = await transactionCollection.findOne({"paymentAddress":paymentAddress});
	return result;
}


export async function saveOrUpdate(txId:string, revealerTx:RevealerTransaction):Promise<RevealerTransaction> {
  let result:RevealerTransaction;
  try {
    result = (await saveTransaction(revealerTx)) as unknown as RevealerTransaction
  } catch (err:any) {
    // non unique key - means the user clicked went back and clicked again
    const tx = await findTransactionByTxId(txId)
    console.log('getPsbtForDeposit: updating ephemeral tx: ' + revealerTx.txId)
    revealerTx.created = tx.created
    revealerTx._id = tx._id;
    result = (await updateTransaction(tx.txId, revealerTx)) as unknown as RevealerTransaction
  }
  return result
}

export function convertToRevealerTx(txType:RevealerTxTypes, psbts:PSBTHolder, req:OpReturnRequest, sbtcPublicKey:string) {
  const txId = req.recipient + ':' + req.amountSats + ':' + req.paymentPublicKey
  const created = (new Date()).getTime()
  const revealerTx:RevealerTransaction = {
    txId,
    psbt: psbts.hexPSBT,
    signed: false,
    originator: req.originator, 
    recipient: req.recipient, 
    signature: req.signature,
    amountSats: req.amountSats,
    confirmations: -1,
    sbtcPublicKey,
    paymentPublicKey: req.paymentPublicKey,
    paymentAddress: req.paymentAddress,
    mode: RevealerTxModes.OP_RETURN,
    status:CommitmentStatus.UNPAID,
    type: txType,
    created,
    updated: created,
    blockHeight:0
  }
  return revealerTx

}
export function convertToRevealerTxOpDrop(req:OpDropRequest, commitment:CommitmentScriptDataType, sbtcPublicKey:string) {
  const txId = req.recipient + ':' + req.amountSats + ':' + req.reclaimPublicKey
  const created = (new Date()).getTime()
  const revealerTx:RevealerTransaction = {
    txId,
    signed: false,
    originator: req.originator, 
    recipient: req.recipient, 
    amountSats: req.amountSats,
    commitment,
    confirmations: -1,
    sbtcPublicKey,
    paymentPublicKey: req.reclaimPublicKey,
    paymentAddress: req.paymentAddress, // this may change when the actual payment address is on-chain
    mode: RevealerTxModes.OP_DROP,
    status:CommitmentStatus.UNPAID,
    type: RevealerTxTypes.SBTC_DEPOSIT,
    created,
    updated: created,
    blockHeight:0
  }
  return revealerTx
}
