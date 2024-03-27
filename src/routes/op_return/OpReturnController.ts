import { Body, Get, Post, Route } from "tsoa";
import { buildOpReturnDepositTransaction } from "../../lib/transaction/deposit_utils.js";
import { hex, base64 } from '@scure/base';
import * as btc from '@scure/btc-signer';
import { OpReturnRequest, PSBTHolder, RevealerTransaction, RevealerTxTypes } from "../../types/revealer_types.js";
import { broadcastBitcoinTransaction } from "../../lib/broadcast_utils.js";
import { convertToRevealerTx, findTransactionByTxId, saveOrUpdate, updateDeposit, updateDepositForSuccessfulBroadcast } from "../transactions/transaction_db.js";
import { buildWithdrawalTransaction } from "../../lib/transaction/withdraw_utils.js";
import { getHashBytesFromAddress } from "../../lib/bitcoin_utils.js";
import { getCurrentSbtcPublicKey } from "../../lib/sbtc_utils.js";

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
   * @param paymentAddress address for utxo - most likely users wallet bitcoin address but does not have to be. 
   * Also used for change address to send deposit from
   * @returns unsigned psbt
   */
  @Post("/get-psbt-for-deposit")
  public async getPsbtForDeposit(@Body() dr:OpReturnRequest): Promise<PSBTHolder|undefined> {
    try {
      //const hashBytes = getHashBytesFromAddress(dr.paymentAddress)
      //if (!hashBytes) throw new Error('Payment address is unknown: ' + dr.paymentAddress)
      if (!dr.recipient.startsWith('S')) throw new Error('Recipient is unknown: ' + dr.recipient) 
      const {transaction, txFee} = await buildOpReturnDepositTransaction(dr.recipient, dr.amountSats, dr.paymentPublicKey, dr.paymentAddress, dr.feeMultiplier)
      if (!transaction) return
      const psbts = {
        hexPSBT: hex.encode(transaction.toPSBT()),
        b64PSBT: base64.encode(transaction.toPSBT()),
        txFee
      }
      const sbtcPublicKey = await getCurrentSbtcPublicKey()
      const revealerTx:RevealerTransaction = convertToRevealerTx(RevealerTxTypes.SBTC_DEPOSIT, psbts, dr, sbtcPublicKey)
      revealerTx.psbt = psbts.hexPSBT
      await saveOrUpdate(revealerTx.txId, revealerTx)
      return psbts
    } catch(err) {
      console.error('getPsbtForDeposit: ', err)
      throw new Error(err.message);
    }
  }

  /**
   * Build an sBTC withdrawal PSBT using OP_RETURN for the user to sign and sed.
   * @returns unsigned psbt
   */
  @Post("/get-psbt-for-withdrawal")
  public async getPsbtForWithdrawal(@Body() wr:OpReturnRequest): Promise<PSBTHolder|undefined> {
    try {
      //const hashBytes = getHashBytesFromAddress(wr.recipient)
      //if (!hashBytes) throw new Error('Recipient is unknown: ' + wr.recipient)
      const {transaction, txFee} = await buildWithdrawalTransaction(wr.recipient, wr.signature, wr.amountSats, wr.paymentPublicKey, wr.paymentAddress, wr.feeMultiplier)
      if (!transaction) return
      const psbts = {
        hexPSBT: hex.encode(transaction.toPSBT()),
        b64PSBT: base64.encode(transaction.toPSBT()),
        txFee
      }
      const sbtcPublicKey = await getCurrentSbtcPublicKey()
      const revealerTx:RevealerTransaction = convertToRevealerTx(RevealerTxTypes.SBTC_WITHDRAWAL, psbts, wr, sbtcPublicKey)
      revealerTx.psbt = psbts.hexPSBT
      await saveOrUpdate(revealerTx.txId, revealerTx)
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

  @Post("/update-deposit")
  public async clientBroadcastDeposit(@Body() tx: {txId:string, recipient:string, amountSats:number, paymentPublicKey:string, signedPsbtHex:string, maxFeeRate:number}): Promise<RevealerTransaction> {
    const oldTxId = tx.recipient + ':' + tx.amountSats + ':' + tx.paymentPublicKey
    await updateDeposit(tx.txId, oldTxId, tx.signedPsbtHex)
    return await updateDepositForSuccessfulBroadcast(tx.txId)
  }

}