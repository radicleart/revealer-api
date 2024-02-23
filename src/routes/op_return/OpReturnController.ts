import { Body, Get, Post, Route } from "tsoa";
import { buildDepositTransaction } from "../../lib/transaction/deposit_utils.js";
import { hex, base64 } from '@scure/base';
import * as btc from '@scure/btc-signer';
import { PSBTHolder, RevealerTransaction, RevealerTxModes, RevealerTxTypes } from "../../types/revealer_types.js";
import { broadcastBitcoinTransaction } from "../../lib/broadcast_utils.js";
import { findTransactionByTxId, saveTransaction, updateDeposit, updateDepositForSuccessfulBroadcast, updateTransaction } from "./transaction_db.js";
import { buildWithdrawalTransaction } from "../../lib/transaction/withdraw_utils.js";

/**
 * Builds and stores commitment transactions for sbtc commit reveal patterns
 */
@Route("/revealer-api/v1/op_return")
export class OpReturnController {
  
  /**
   * Build an sBTC deposit PSBT using OP_RETURN for the user to sign and sed.
   * @param recipient stacks account or contract principle to receive sBTC 
   * @param amountSats amount user wishes to deposit 
   * @param paymentPublicKey public key to spend utxos
   * @param paymentAddress also used for change address to send deposit from
   * @returns unsigned psbt
   */
  @Get("/get-psbt-for-deposit/:recipient/:amountSats/:paymentPublicKey/:paymentAddress/:feeMultiplier")
  public async getPsbtForDeposit(recipient:string, amountSats:number, paymentPublicKey:string, paymentAddress:string, feeMultiplier:number): Promise<PSBTHolder|undefined> {
    try {
      const {transaction, txFee} = await buildDepositTransaction(recipient, amountSats, paymentPublicKey, paymentAddress, feeMultiplier)
      if (!transaction) return
      const psbts = {
        hexPSBT: hex.encode(transaction.toPSBT()),
        b64PSBT: base64.encode(transaction.toPSBT()),
        txFee
      }
      const txId = recipient + ':' + amountSats + ':' + paymentPublicKey
      const created = (new Date()).getTime()
      const revealerTx:RevealerTransaction = {
        txId,
        psbt: psbts.hexPSBT,
        signed: false,
        recipient, 
        amountSats,
        confirmations: -1,
        paymentPublicKey,
        paymentAddress,
        mode: RevealerTxModes.OP_RETURN,
        type: RevealerTxTypes.SBTC_DEPOSIT,
        created,
        updated: created
      }
      try {
        await saveTransaction(revealerTx)
      } catch (err:any) {
        // non unique key - means the user clicked went back and clicked again
        const tx = await findTransactionByTxId(txId)
        console.log('getPsbtForDeposit: updating ephemeral tx: ' + revealerTx.txId)
        revealerTx.created = tx.created
        revealerTx.psbt = psbts.hexPSBT
        revealerTx._id = tx._id;
        await updateTransaction(tx.txId, revealerTx) 
      }
      return psbts
    } catch(err) {
      console.error('getPsbtForDeposit: ', err)
      throw new Error(err.message);
    }
  }

  /**
   * Build an sBTC deposit PSBT using OP_RETURN for the user to sign and sed.
   * @param withdrawalAddress bitcoin address to receive BTC 
   * @param amountSats amount user wishes to deposit 
   * @param paymentPublicKey public key to spend utxos
   * @param paymentAddress also used for change address to send deposit from
   * @returns unsigned psbt
   */
  @Get("/get-psbt-for-withdrawal/:withdrawalAddress/:signature/:amountSats/:paymentPublicKey/:paymentAddress/:feeMultiplier")
  public async getPsbtForWithdrawal(withdrawalAddress:string, signature:string, amountSats:number, paymentPublicKey:string, paymentAddress:string, feeMultiplier:number): Promise<PSBTHolder|undefined> {
    try {
      const {transaction, txFee} = await buildWithdrawalTransaction(withdrawalAddress, signature, amountSats, paymentPublicKey, paymentAddress, feeMultiplier)
      if (!transaction) return
      const psbts = {
        hexPSBT: hex.encode(transaction.toPSBT()),
        b64PSBT: base64.encode(transaction.toPSBT()),
        txFee
      }
      const txId = withdrawalAddress + ':' + amountSats + ':' + paymentPublicKey
      const created = (new Date()).getTime()
      const revealerTx:RevealerTransaction = {
        txId,
        psbt: psbts.hexPSBT,
        signed: false,
        recipient: withdrawalAddress, 
        amountSats,
        confirmations: -1,
        paymentPublicKey,
        paymentAddress,
        signature,
        mode: RevealerTxModes.OP_RETURN,
        type: RevealerTxTypes.SBTC_WITHDRAWAL,
        created,
        updated: created
      }
      try {
        await saveTransaction(revealerTx)
      } catch (err:any) {
        // non unique key - means the user clicked went back and clicked again
        const tx = await findTransactionByTxId(txId)
        console.log('getPsbtForDeposit: updating ephemeral tx: ' + revealerTx.txId)
        revealerTx.created = tx.created
        revealerTx.psbt = psbts.hexPSBT
        revealerTx._id = tx._id;
        await updateTransaction(tx.txId, revealerTx)
      }
      return psbts
    } catch(err) {
      console.error('getPsbtForDeposit: ', err)
      throw new Error(err.message);
    }
  }

  /**
   * Broadcast signed psbt / transaction. Note the recipient, amount and
   * public key are used to make a temporary unique id. Its possible the user 
   * can broadcast the siged psbt outside the bridge but the default case is they
   * sig ad broadcast from the bridge app - i which  case we replace the temporary
   * unique id with the tx id of the finalised tx. This makes payment lookups a lot simpler
   * @param recipient stacks account or contract principle to receive sBTC 
   * @param amountSats amount user wishes to deposit 
   * @param paymentPublicKey public key to spend utxos
   * @param hex transaction 
   * @param maxFeeRate fee rate 
   * @returns string 
   */
  @Post("/broadcast-deposit")
  public async sendRawTransaction(@Body() tx: {recipient:string, amountSats:number, paymentPublicKey:string, signedPsbtHex:string, maxFeeRate:number}): Promise<RevealerTransaction> {
    try {
      const inTx = btc.Transaction.fromRaw(hex.decode(tx.signedPsbtHex), {allowUnknowInput:true, allowUnknowOutput: true, allowUnknownOutputs: true, allowUnknownInputs: true})
      let revealerTx = await findTransactionByTxId(tx.recipient + ':' + tx.amountSats + ':' + tx.paymentPublicKey) as RevealerTransaction;
      if (!revealerTx) throw Error('Expecting tx to broadcast to be known to api');
      console.log('sendRawTransaction: tx: ', tx)
      const resp = await broadcastBitcoinTransaction(tx.signedPsbtHex, tx.maxFeeRate)
      console.log('sendRawTransaction: broadcast response: ', resp)
      await updateDeposit(inTx.id, revealerTx.txId, tx.signedPsbtHex)
      return await updateDepositForSuccessfulBroadcast(inTx.id)
    } catch (err:any) {
      console.log('sendRawTransaction: error: ' + err.message)
      throw new Error('Broadcast error: ' + err.message)
    }
  }

  @Post("/client-broadcast-deposit")
  public async clientBroadcastDeposit(@Body() tx: {txId:string, recipient:string, amountSats:number, paymentPublicKey:string, signedPsbtHex:string, maxFeeRate:number}): Promise<RevealerTransaction> {
    const oldTxId = tx.recipient + ':' + tx.amountSats + ':' + tx.paymentPublicKey
    await updateDeposit(tx.txId, oldTxId, tx.signedPsbtHex)
    return await updateDepositForSuccessfulBroadcast(tx.txId)
  }
}
