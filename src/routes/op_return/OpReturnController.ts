import { Body, Get, Post, Route } from "tsoa";
import { buildDepositTransaction } from "../../lib/transaction/deposit_utils.js";
import { hex, base64 } from '@scure/base';
import * as btc from '@scure/btc-signer';
import { getNet } from "../../lib/utils.js";
import { getConfig } from "../../lib/config.js";
import { PSBTHolder, RevealerTransaction, RevealerTxModes, RevealerTxTypes } from "../../types/revealer_types.js";
import { sendRawTxDirectBlockCypher, sendRawTxDirectMempool, sendRawTxRpc } from "../../lib/broadcast_utils.js";
import { findTransactionByTxId, saveTransaction, updateTransaction } from "./transaction_db.js";

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
  @Get("/get-psbt-for-deposit/:recipient/:amountSats/:paymentPublicKey/:paymentAddress")
  public async getPsbtForDeposit(recipient:string, amountSats:number, paymentPublicKey:string, paymentAddress:string): Promise<PSBTHolder|undefined> {
    try {
      const transaction = await buildDepositTransaction(recipient, amountSats, paymentPublicKey, paymentAddress)
      if (!transaction) return
      const psbts = {
        hexPSBT: hex.encode(transaction.toPSBT()),
        b64PSBT: base64.encode(transaction.toPSBT())
      }
      console.log('getPsbtForDeposit: ', psbts)
      const revealerTx:RevealerTransaction = {
        txId: recipient + ':' + amountSats + ':' + paymentPublicKey,
        psbt: psbts.hexPSBT,
        signed: false,
        recipient, 
        amountSats,
        confirmations: -1,
        paymentPublicKey,
        paymentAddress,
        mode: RevealerTxModes.OP_RETURN,
        type: RevealerTxTypes.SBTC_DEPOSIT,
        created: (new Date()).getTime()
      }
      await saveTransaction(revealerTx)
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
  public async sendRawTransaction(@Body() tx: {recipient:string, amountSats:number, paymentPublicKey:string, hex:string, maxFeeRate:number}): Promise<RevealerTransaction> {
    const inTx = btc.Transaction.fromRaw(hex.decode(tx.hex), {allowUnknowInput:true, allowUnknowOutput: true, allowUnknownOutputs: true, allowUnknownInputs: true})
    const revealerTx = await findTransactionByTxId(tx.recipient + ':' + tx.amountSats + ':' + tx.paymentPublicKey) as RevealerTransaction;
    if (!revealerTx) throw Error('Expecting tx to broadcast to be known to api')
    try {
      const resp =  await sendRawTxRpc(tx.hex, tx.maxFeeRate);
      if (resp && resp.error && resp.error.code) {
        if (resp.error.code === -27) { // Transaction already in block chain
          return resp;
        }
        console.log('sendRawTransaction:sendRawTxRpc: ', resp)
        throw new Error('Local rpc call failed.. try external service')
      }
      console.log('sendRawTransaction 1: bitcoin core:', resp);
    } catch (err) {

      try {
        console.log('sendRawTransaction 2: rpc error: ', err);
        console.log('sendRawTransaction 2: trying mempool: ');
        const resp = await sendRawTxDirectMempool(tx.hex);
        console.log('sendRawTransaction 2: sendRawTxDirectMempool: ', resp);
      } catch (err) {
        try {
          console.log('sendRawTransaction 3: mempool error: ', err);
          const resp = await sendRawTxDirectBlockCypher(tx.hex);
          console.log('sendRawTransaction 3: sendRawTxDirectBlockCypher: ', resp);
        } catch (err:any) {
          throw new Error('Unable to broadcast this transaction: ' + revealerTx.txId)
        }
      }
      await updateTransaction(revealerTx, {txId: inTx.id, confirmations:0, signed:true});
      return revealerTx;
    }
  }

  
}
