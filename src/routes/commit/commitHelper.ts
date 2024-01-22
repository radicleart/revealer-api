import { getNet } from "sbtc-bridge-lib/dist/wallet_utils";
import * as secp from '@noble/secp256k1';
import * as btc from '@scure/btc-signer';
import { hex } from '@scure/base';
import { schnorr } from '@noble/curves/secp256k1';
import { CommitmentType, TaprootScriptType, CommitmentStatus, UTXO, CommitmentRequest, CommitmentMode } from "../../types/revealer_types.js";
import { buildDepositPayloadOpDrop } from "../../lib/sbtc_utils.js";
import { toStorable } from "../../lib/utils.js";
import { findCommitmentsByFilter, updateCommitment } from "./commitment_db.js";
import { addInputs, fetchAddressTransactions, fetchUtxoSet, inputAmt } from "../../lib/bitcoin_utils.js";
import { getConfig } from "../../lib/config.js";
import { buildInscriptionPayload } from "../../lib/inscription_utils.js";

export function getCommitmentForInscription (commitRequest:CommitmentRequest) {
	const net = getNet(getConfig().network);
	const data = buildInscriptionPayload(commitRequest.revealerPublicKey, commitRequest.inscriptionPayload);
	//const scripts =  [
	//	{ script: btc.Script.encode([data, 'DROP', hex.decode(this.commitKeys.revealPub), 'CHECKSIG']) },
	//	{ script: btc.Script.encode([hex.decode(this.commitKeys.reclaimPub), 'CHECKSIG']) }
	//]
	const scripts =  [
		{ script: data },
		{ script: btc.Script.encode(['IF', 144, 'CHECKSEQUENCEVERIFY', 'DROP', hex.decode(commitRequest.reclaimerPublicKey), 'CHECKSIG', 'ENDIF']) },
	]
	const script = btc.p2tr(btc.TAPROOT_UNSPENDABLE_KEY, scripts, net, true);
	return toStorable(script)
}

export function getCommitmentForSbtcDeposit(commitRequest:CommitmentRequest):TaprootScriptType {
	const net = getNet(getConfig().network);

	const data = buildDepositPayloadOpDrop(getConfig().network, commitRequest.revealFee, commitRequest.recipientStxPrincipal);
	const scripts =  [
		{ script: btc.Script.encode([hex.decode(data), 'DROP', hex.decode(commitRequest.revealerPublicKey), 'CHECKSIG']) },
		{ script: btc.Script.encode(['IF', 144, 'CHECKSEQUENCEVERIFY', 'DROP', hex.decode(commitRequest.reclaimerPublicKey), 'CHECKSIG', 'ENDIF']) },
	]
	const script = btc.p2tr(btc.TAPROOT_UNSPENDABLE_KEY, scripts, net, true);
  	return toStorable(script)
}

export async function getCommitPaymentPsbt (revealFeeWithGas:number, payToAddress:string, payFromAddress:string) {
	
	const utxoSet:Array<UTXO> = await fetchUtxoSet(payFromAddress, true)
	const net = getNet(getConfig().network);
	const tx = new btc.Transaction({ allowUnknowInput: true, allowUnknowOutput: true });
	addInputs(getConfig().network, revealFeeWithGas, 0, tx, false, utxoSet, '');
	tx.addOutputAddress(payToAddress, BigInt(revealFeeWithGas), net );
	const changeAmount = inputAmt(tx) - (revealFeeWithGas + Number(tx.fee)); 
	if (changeAmount > 0) tx.addOutputAddress(payFromAddress, BigInt(changeAmount), net);
    const currentTx = hex.encode(tx.toPSBT());
	return currentTx
}

export async function scanForPayments() {
	let matchCount = 0;
	const filter = { status: CommitmentStatus.UNPAID, mode: CommitmentMode.OP_DROP };
	try {
	  const requests:any = await findCommitmentsByFilter(filter);
	  if (!requests || requests.length === 0) return;
	  for (const peginRequest of requests) {
		if (peginRequest.mode === CommitmentMode.OP_RETURN) {
		  console.log('Skipping op_return');
		} else {
		  if (peginRequest.commitTxScript) {
			const address = peginRequest.commitTxScript.address;
			try {
			  const txs:Array<any> = await fetchAddressTransactions(address);
			  if (txs && txs.length > 0) {
				//console.log('scanBridgeTransactions: processing: ' + txs.length + ' from ' + address);
				matchCount += await matchCommitmentIn(txs, peginRequest);
			  }
			} catch(err:any) {
			  console.log('scanBridgeTransactions: processing: ' + err.message);
			}
		  }
		}
	  }
	} catch (err: any) {
	  console.log('scanBridgeTransactions: requests: ', err)
	}
	  return { matched: matchCount };
  }
  
  async function matchCommitmentIn(txs:Array<any>, peginRequest:CommitmentType):Promise<number> {
	let matchCount = 0;
	for (const tx of txs) {
	  //console.log('scanBridgeTransactions: tx: ', tx);
	  for (const vout of tx.vout) {
		const senderAddress = tx.vin[0]?.prevout?.scriptpubkey_address || undefined;
		//console.log('matchCommitmentIn: matching: ' + peginRequest.uiPayload.amountSats + ' to ' + vout.value)
		if (peginRequest.taprootScript?.address === vout.scriptpubkey_address) {
		  const up = {
			tries:  (peginRequest.tries) ? peginRequest.tries + 1 : 1,
			btcTxid: tx.txid,
			senderAddress,
			status: CommitmentStatus.PAID,
			vout: vout
		  }
		  await updateCommitment(peginRequest, up);
		  matchCount++;
		} else {
		  await updateCommitment(peginRequest, { tries:  ((peginRequest.tries || 1) + 1) });
		}
	  }
	}
	return matchCount;
  }
  