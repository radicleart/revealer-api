import { Body, Get, Post, Route } from "tsoa";
import { getConfig } from "../../lib/config.js";
import { CommitmentRequest, CommitmentResponse, RequestType, CommitmentError } from "../../types/revealer_types.js";
import { getNet } from "sbtc-bridge-lib/dist/wallet_utils.js";
import { UTXO, toStorable } from "sbtc-bridge-lib";
import * as btc from '@scure/btc-signer';
import { addInputs, fetchUtxoSet, inputAmt } from "../../lib/bitcoin_utils.js";
import { hex } from '@scure/base';
import { utf8ToBytes } from "@noble/curves/abstract/utils.js";

/**
 * Builds and stores commitment transactions for sbtc commit reveal patterns
 */
export class CommitController {

  
  /**
   * Build and save the commitment data for a taproot inscription. Return the address for invoice.
   * If payFromAddress is provided also returns a payment psbt for the web wallet.
   * @param CommitmentRequest 
   * @returns CommitmentResponse
   */
  public async saveInscriptionCommitment(@Body() commitmentRequest:CommitmentRequest): Promise<CommitmentResponse> {
    try {
      const taprootScript = getCommitmentForInscription(commitmentRequest);
      //saveCommitment(commitment)
      let paymentPsbt
      if (commitmentRequest.payFromAddress) {
        paymentPsbt = await getCommitPaymentPsbt(commitmentRequest.revealFee, taprootScript.address, commitmentRequest.payFromAddress);
      }
      return { paymentPsbt, commitAddress: taprootScript.address };
    } catch(err) {
      throw new Error(err.message);
    }
  }  
}
function getCommitmentForInscription (commitRequest:CommitmentRequest) {
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

function buildInscriptionPayload (revealPubKey:string, payload:string) {
	const net = getNet(getConfig().network);
	const ord = utf8ToBytes('ord')
	const ct = utf8ToBytes('text/plain;charset=utf-8')
	const msg = utf8ToBytes('Hello Raphael')
	return btc.Script.encode([hex.decode(revealPubKey), 'CHECKSIG', 0, 'IF', ord, ct, msg, 'ENDIF'])

/**
		OP_IF
		  OP_PUSH "ord"
		  OP_PUSH 1
		  OP_PUSH "text/plain;charset=utf-8"
		  OP_PUSH 0
		  OP_PUSH "Hello, world!"
		OP_ENDIF		

		OP_PUSHBYTES_32 bad5e0c0a331133fa5926c30a2c9d0f5a8b295d6050b8d34dccc8bab5846d3a6

		OP_CHECKSIG
		OP_0
		OP_IF
		OP_PUSHBYTES_3 6f7264
		OP_PUSHBYTES_1 01
		OP_PUSHBYTES_10 696d6167652f6a706567
		OP_0
		OP_PUSHDATA2 ffd8ffe000104a46494600010100000100010000fffe001f436f6d70726573736564206279206a7065672d7265636f6d7072657373ffdb0084000404040404040404040406060506060807070707080c09090909090c130c0e0c0c0e0c131114100f1014111e171515171e221d1b1d222a25252a34323444445c010404040404040404040406060506060807070707080c09090909090c130c0e0c0c0e0c131114100f1014111e171515171e221d1b1d222a25252a34323444445cffc20011080200020003012200021101031101ffc4001d000100010403010000000000000000000000010206070803040509ffda0008010100000000d46fa297e4800000000000001627cf1fa0b9100000000000000029b26f98840901200000004080264899a0000990000042000015522aa40009900001080000013348001290000041000004ca900013200000204000054a4000264000001100002654800012900000110000545200004c80000204000151480004c8000008040005452098005400250008125200264a425001321558b6b53d5f32daca17bfbc000110002a29094004ca6c1c59e35ef78f42d8e9df9182ae8f67d2f5724f726000a40099290000ab1cd8bea5d3514cb1c593dcce54631bef13e5cca8f02d5c9002100132440000b03c8f7288888f23c1e8deddcb5ecacbbd0c7bdec4d9d711636cbbdbda3e6010412248800018cbbf5743cc
		OP_PUSHDATA2 afd9b3ed2bdf86eab73d0d78f071cda3ef
		OP_PUSHBYTES_27 ddeef466bb68f5847df1f7063eee3d079573aec358a3d4815fffd9
		OP_ENDIF
 */
}
async function getCommitPaymentPsbt (revealFeeWithGas:number, payToAddress:string, payFromAddress:string) {
	
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

