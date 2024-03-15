import { CommitmentStatus, RevealerTxModes, RevealerTransaction, RevealerTxTypes } from "../../types/revealer_types.js";
import { fetchAddressTransactions, fetchTransaction } from "../../lib/bitcoin_utils.js";
import { findTransactionByTxId, findTransactionsByFilter, saveTransaction, updateTransaction } from "./transaction_db.js";
import * as btc from '@scure/btc-signer';
import { hex } from '@scure/base';
import { getConfig } from "../../lib/config.js";
import { convertToRevealerTransaction, parsePayloadFromTransaction, parseRawPayload } from "../../lib/transaction/payload_utils.js";
import { fmtNumber } from "../../lib/transaction/formatting.js";
import { getNet } from "../../lib/transaction/wallet_utils.js";

export async function scanBySbtcWallet(sbtcWalletAddress:string, addressTxs:Array<any>) {
	try {
		if (addressTxs && addressTxs.length > 0) {
			console.log('scanBySbtcWallet: ' + sbtcWalletAddress + ' found ' + addressTxs.length + ' transactions')
			for (const tx of addressTxs) {
				await sbtcWalletTx(tx)
			}
		}
	} catch (err: any) {
	  console.error('scanBySbtcWallet: requests: ', err)
	}
	return;
}

export async function scanBySbtcWalletTransaction(txid:string):Promise<RevealerTransaction> {
	let newRevealerTx:RevealerTransaction;
	try {
		const tx:any = await fetchTransaction(txid, true);
		newRevealerTx = await sbtcWalletTx(tx)
	} catch (err: any) {
	  console.error('scanBySbtcWalletTransaction: requests: ', err)
	}
	return newRevealerTx;
}

export async function scanUnpaidTransactions():Promise<Array<RevealerTransaction>> {
	let newRevealerTxs:Array<RevealerTransaction> = [];
	try {
		const filter = { status: CommitmentStatus.UNPAID };
		const revealerTxs:Array<RevealerTransaction> = await findTransactionsByFilter(filter, 0, 100, 'blockHeight');
		if (!revealerTxs || revealerTxs.length === 0) return;
		console.log('scanUnpaidTransactions: revealerTxs: ' + (revealerTxs?.length || 0));
		for (const revealerTx of revealerTxs) {
			if (revealerTx.mode === RevealerTxModes.OP_DROP) {
				newRevealerTxs.push(await unpaidOpDrop(revealerTx));
			} else {
				newRevealerTxs.push(await unpaidOpReturn(revealerTx));
			}
		}
	} catch (err: any) {
	  console.error('scanUnpaidTransactions: requests: ', err)
	}
	return newRevealerTxs;
}

export async function scanSpecificCommitment(revealerTx:RevealerTransaction) {
	console.log('scanSpecificCommitment: revealerTx: ', revealerTx)
	let newRevealerTx:RevealerTransaction;
	try {
		if (revealerTx.mode === RevealerTxModes.OP_DROP) {
			newRevealerTx = await unpaidOpDrop(revealerTx);
		} else {
			newRevealerTx = await unpaidOpReturn(revealerTx);
		}
	} catch (err: any) {
	  console.error('scanSpecificCommitment: requests: ', err)
	}
	return newRevealerTx;
}

export async function unpaidOpDrop(revealerTx:RevealerTransaction):Promise<RevealerTransaction> {
	const address = revealerTx.commitment.address;
	try {
		const addressTxs:Array<any> = await fetchAddressTransactions(address);
		console.log('unpaidOpDrop: addressTxs: ' + (addressTxs?.length || 0));
		if (addressTxs && addressTxs.length > 0) {
			for (const tx of addressTxs) {
				//console.log('unpaidOpDrop: tx: ', tx);
				for (const vout of tx.vout) {
					//console.log('unpaidOpDrop: vout: ', vout);
					if (revealerTx.commitment.address === vout.scriptpubkey_address) {
						const previousOut = tx.vin[0]?.prevout
						const paymentAddress = previousOut.scriptpubkey_address || undefined;
						const paymentPublicKey = previousOut.scriptpubkey.substring(4) || undefined;
						const status = (tx.status.confirmed) ? CommitmentStatus.PAID : CommitmentStatus.PENDING
						const up = {
							txId: tx.txid,
							paymentAddress,
							paymentPublicKey,
							status,
							vout: vout,
							blockHeight: tx.status?.block_height || 0
						}
						await updateTransaction(revealerTx.txId, up);
				  	}
				}
			}
		}
		return revealerTx;
	} catch(err:any) {
		console.log('unpaidOpDrop: processing: ' + err.message);
	}
}

async function unpaidOpReturn(revealerTx:RevealerTransaction):Promise<RevealerTransaction> {
	let bitcoinTxId = revealerTx.txId
	if (revealerTx.txId.indexOf(':') > -1) {
		bitcoinTxId = await getBitcoinTxId(revealerTx)
		if (!bitcoinTxId) return
	}
	const memTx = await fetchTransaction(revealerTx.txId, true)
	const txHex = memTx.hex
	if (!txHex) return
	const tx:btc.Transaction = btc.Transaction.fromRaw(hex.decode(txHex), {allowUnknowInput:true, allowUnknowOutput: true, allowUnknownOutputs: true, allowUnknownInputs: true})
	
	const payload = await parsePayloadFromTransaction(getConfig().network, txHex)
	if (payload.opcode === '3C' && revealerTx.type !== RevealerTxTypes.SBTC_DEPOSIT) {
		return
	} else if (payload.opcode === '3E' && revealerTx.type !== RevealerTxTypes.SBTC_WITHDRAWAL) {
		return
	}
	console.log('unpaidOpReturn: payload: ', payload)
	const up = {
		txId: bitcoinTxId,
		vout0: tx.getOutput(0),
		//vout: outp,
		status: CommitmentStatus.PENDING,
		blockHeight: memTx.status.block_height || 0

	}
	const rTx = await updateTransaction(revealerTx.txId, up);
	if (rTx) {
		return rTx as unknown as RevealerTransaction
	}
}
  
async function getBitcoinTxId(revealerTx:RevealerTransaction):Promise<string|undefined> {
	try {
		const addressTxs:Array<any> = await fetchAddressTransactions(revealerTx.paymentAddress);
		if (addressTxs && addressTxs.length > 0) {
			for (const tx of addressTxs) {
				const previousOut = tx.vin[0]?.prevout
				if (revealerTx.paymentAddress === previousOut.scriptpubkey_address) {
					if (tx.vout[0].value === 0) {
						// payment address matches and first output is op_return
						return tx.txid;
					}
				}
			}
		}
	} catch(err:any) {
		console.log('getBitcoinTxId: processing: ' + err.message);
	}
}

async function sbtcWalletTx(tx:any):Promise<RevealerTransaction> {
	const txId = tx.txid;
	try {
		let revealerTx = await findTransactionByTxId(txId)
		if (revealerTx  && revealerTx.blockHeight) {
			// concerned with historical transactions here
			console.log('sbtcWalletTx: revealerTx already in db. tx: ' + fmtNumber(revealerTx.blockHeight) + ' : ' + revealerTx.txId)
			return
		}
		const vout0 = tx.vout[0]
		if (vout0.scriptpubkey_type !== 'unknown' && vout0.scriptpubkey_type !== 'op_return') {
			// concerned with op_return transactions
			console.log('scanBySbtcWallet: wrong vout0.scriptpubkey_type: ' + vout0.scriptpubkey_type)
			// this is consolidation transaction - requires research...
			return
		}
		const network = getConfig().network
		let recipientAddress = tx.vout[1].scriptpubkey_address
		const payload = parseRawPayload(network, vout0.scriptpubkey, recipientAddress, 'vrs') as any
		// only true for op_return deposits
		const net = getNet(getConfig().network)
		let outputScript = btc.OutScript.decode(hex.decode(tx.vout[1].scriptpubkey))
		let address:string
		if (payload.opcode === '3C') {
			payload.amountSats = tx.vout[1].value
			outputScript = btc.OutScript.decode(hex.decode(tx.vout[1].scriptpubkey))
		} else if (payload.opcode === '3E') {
			outputScript = btc.OutScript.decode(hex.decode(tx.vout[2].scriptpubkey))
		}

		if (outputScript.type === 'pk' || outputScript.type === 'tr') {
			address = btc.Address(net).encode({
			  type: outputScript.type,
			  pubkey: outputScript.pubkey,
			});
			payload.sbtcPublicKey = hex.encode(outputScript.pubkey)
		}
		payload.sbtcWalletAddress = address //getPegWalletAddressFromPublicKey(getConfig().network, sbtcWallet)
		
		revealerTx = convertToRevealerTransaction(payload, tx)
		console.log('sbtcWalletTx: converting to revealer tx: ' + fmtNumber(revealerTx.blockHeight) + ' : ' + revealerTx.txId)
		await saveTransaction(revealerTx);
		return revealerTx;

		/**
		for (const vout of tx.vout) {
			//console.log('unpaidOpDrop: vout: ', vout);
			if (revealerTx.commitment.address === vout.scriptpubkey_address) {
				const previousOut = tx.vin[0]?.prevout
				const paymentAddress = previousOut.scriptpubkey_address || undefined;
				const paymentPublicKey = previousOut.scriptpubkey.substring(4) || undefined;
				const status = (tx.status.confirmed) ? CommitmentStatus.PAID : CommitmentStatus.PENDING
				const up = {
					txId: tx.txid,
					paymentAddress,
					paymentPublicKey,
					status,
					vout: vout
				}
				await updateTransaction(revealerTx.txId, up);
			}
		}
		 */
	} catch(err:any) {
		console.log('sbtcWalletTx: processing: ' + err.message);
	}
}

