import * as btc from '@scure/btc-signer';
import * as secp from '@noble/secp256k1';
import * as P from 'micro-packed';
import { hex } from '@scure/base';
import type { Transaction } from '@scure/btc-signer' 
import { buildDepositPayload } from './payload_utils.js' 
import { addInputs, getNet, getPegWalletAddressFromPublicKey, inputAmt } from './wallet_utils.js';
import { BridgeTransactionType, DepositPayloadUIType } from 'sbtc-bridge-lib';
import { UTXO } from '../../types/revealer_types.js';
import { fetchUtxoSet } from '../bitcoin_utils.js';
import { getConfig } from '../config.js';
import { SbtcWalletController, cachedUIObject } from '../../routes/sbtc/SbtcWalletController.js';
import { FeeEstimateResponse } from '../../types/sbtc_ui_types.js';


const concat = P.concatBytes;

const privKey = hex.decode('0101010101010101010101010101010101010101010101010101010101010101');
export const revealPayment = 10001
export const dust = 500;

/**
 * buildDepositTransaction:Transaction
 * @param network (testnet|mainnet)
 * @param sbtcWalletPublicKey - the sbtc wallet public to sending the deposit to
 * @param uiPayload:DepositPayloadUIType
 * - recipient - stacks address or contract principal to mint to
 * - amountSats - amount in sats of sBTC to mint (and bitcoin to deposit)
 * - changeAddress - address for users change - the users cardinal/payment address
 * - paymentPublicKey - public key for users change - the users cardinal/payment public key (only needed for xverse)
 * - btcFeeRates current fee rate estimates - see endpoint /bridge-api/testnet/v1/sbtc/init-ui
 * - utxos the users utxos to spend from - from mempool/blockstream
 * @returns Transaction from @scure/btc-signer
 */
export async function buildDepositTransaction(recipient:string, amountSats:number, paymentPublicKey:string, paymentAddress:string, feeMultiplier:number):Promise<{transaction:Transaction, txFee:number}> {
	const network = getConfig().network
	const net = getNet(getConfig().network);
	const controller = new SbtcWalletController();
	const cachedUIObject = await (controller.initUi())
	const sbtcWalletPublicKey = cachedUIObject.sbtcContractData.sbtcWalletPublicKey
	const fees:FeeEstimateResponse = cachedUIObject.btcFeeRates;
	let utxos:Array<UTXO> = []
	try {
		utxos = (await fetchUtxoSet(paymentAddress, true)).utxos
	} catch (err:any) {
		console.error('=============================================================== ')
		console.error('buildDepositTransaction: Error fetching utxos: address: ' + paymentAddress)
		console.error('buildDepositTransaction: Error fetching utxos: ' + err.message)
		console.error('=============================================================== ')
		throw new Error('Unable to lookup UTXOs for address this could be a network failure or rate limiting by remote service: ' + paymentAddress)
	}
	//console.log('buildDepositTransaction: utxos:', utxos)

	const sbtcWalletAddress = getPegWalletAddressFromPublicKey(network, sbtcWalletPublicKey)
	const data = buildDepositPayload(network, recipient);

	const transaction = new btc.Transaction({ allowUnknowInput: true, allowUnknowOutput: true, allowUnknownInputs:true, allowUnknownOutputs:true });
	const txFee = estimateActualFee(transaction, fees.feeInfo) * feeMultiplier
	// no reveal fee for op_return
	addInputs(network, amountSats, txFee, transaction, false, utxos, paymentPublicKey);
	transaction.addOutput({ script: btc.Script.encode(['RETURN', hex.decode(data)]), amount: BigInt(0) });
	transaction.addOutputAddress(sbtcWalletAddress!, BigInt(amountSats), net);
	const changeAmount = inputAmt(transaction) - (amountSats + txFee); 
	if (changeAmount > 0) transaction.addOutputAddress(paymentAddress, BigInt(changeAmount), net);
	return { transaction, txFee};
}

export function getBridgeDeposit(network:string, uiPayload:DepositPayloadUIType, originator:string):BridgeTransactionType {
	const req:BridgeTransactionType = {
		originator,
		uiPayload,
		status: 1,
		mode: 'op_return',
		requestType: 'deposit',
		network,
		created: new Date().getTime(),
		updated: new Date().getTime()
	}
	return req;
}

export function maxCommit(addressInfo:any) {
	if (!addressInfo || !addressInfo.utxos || addressInfo.utxos.length === 0) return 0;
	const summ = addressInfo?.utxos?.map((item:{value:number}) => item.value).reduce((prev:number, curr:number) => prev + curr, 0);
	return summ || 0;
}

export function estimateActualFee (tx:btc.Transaction, feeInfo:any):number {
	try {
		const vsize = tx.vsize;
		const fees = [
			Math.floor(vsize * feeInfo['low_fee_per_kb'] / 1024),
			Math.floor(vsize * feeInfo['medium_fee_per_kb'] / 1024),
			Math.floor(vsize * feeInfo['high_fee_per_kb'] / 1024),
		]
		return fees[1];
	} catch (err:any) {
		return 10000
	}
}

/**
function calculateDepositFees (network:string, opDrop:boolean, amount:number, feeInfo:any, utxos:Array<UTXO>, commitTxScriptAddress:string, data:Uint8Array|undefined) {
	try {
		const net = getNet(network);
		let vsize = 0;
		const tx = new btc.Transaction({ allowUnknowInput: true, allowUnknowOutput: true, allowUnknownInputs:true, allowUnknownOutputs:true });
		addInputs(network, amount, revealPayment, tx, true, utxos, hex.encode(secp.getPublicKey(privKey, true)));
		if (!opDrop) {
			if (data) tx.addOutput({ script: btc.Script.encode(['RETURN', data]), amount: BigInt(0) });
			tx.addOutputAddress(commitTxScriptAddress, BigInt(amount), net);
		} else {
			tx.addOutputAddress(commitTxScriptAddress, BigInt(amount), net );
		}
		const changeAmount = inputAmt(tx) - (amount); 
		if (changeAmount > 0) tx.addOutputAddress(commitTxScriptAddress, BigInt(changeAmount), net);
		//tx.sign(privKey);
		//tx.finalize();
		vsize = tx.vsize;
		const fees = [
			Math.floor(vsize * feeInfo['low_fee_per_kb'] / 1024),
			Math.floor(vsize * feeInfo['medium_fee_per_kb'] / 1024),
			Math.floor(vsize * feeInfo['high_fee_per_kb'] / 1024),
		]
		return fees;
	} catch (err:any) {
		return [ 850, 1000, 1150]
	}
}
 */