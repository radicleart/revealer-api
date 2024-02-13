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
export async function buildDepositTransaction(recipient:string, amountSats:number, paymentPublicKey:string, paymentAddress:string):Promise<Transaction> {
	const network = getConfig().network
	const net = getNet(getConfig().network);
	const controller = new SbtcWalletController();
	const cachedUIObject = await (controller.initUi())
	const sbtcWalletPublicKey = cachedUIObject.sbtcContractData.sbtcWalletPublicKey
	const fees = cachedUIObject.btcFeeRates;
	const utxos:Array<UTXO> = (await fetchUtxoSet(paymentAddress, true)).utxos
	//console.log('buildDepositTransaction: utxos:', utxos)

	const sbtcWalletAddress = getPegWalletAddressFromPublicKey(network, sbtcWalletPublicKey)
	const data = buildDepositPayload(network, recipient);

	const txFees = calculateDepositFees(network, false, amountSats, fees.feeInfo, utxos, sbtcWalletAddress!, hex.decode(data))
	const tx = new btc.Transaction({ allowUnknowInput: true, allowUnknowOutput: true, allowUnknownInputs:true, allowUnknownOutputs:true });
	// no reveal fee for op_return
	addInputs(network, amountSats, 0, tx, false, utxos, paymentPublicKey);
	tx.addOutput({ script: btc.Script.encode(['RETURN', hex.decode(data)]), amount: BigInt(0) });
	tx.addOutputAddress(sbtcWalletAddress!, BigInt(amountSats), net);
	const changeAmount = inputAmt(tx) - (amountSats + txFees[1]); 
	if (changeAmount > 0) tx.addOutputAddress(paymentAddress, BigInt(changeAmount), net);
	return tx;
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
