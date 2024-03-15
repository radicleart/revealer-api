import { Body, Post, Route } from "tsoa";
import { buildOpDropDepositTransaction } from "../../lib/transaction/deposit_utils.js";
import { OpDropRequest, RevealerTransaction } from "../../types/revealer_types.js";
import { getHashBytesFromAddress } from "../../lib/bitcoin_utils.js";
import { convertToRevealerTxOpDrop, saveOrUpdate } from "../transactions/transaction_db.js";
import { getCurrentSbtcPublicKey } from "../../lib/sbtc_utils.js";
import { CommitmentScriptDataType } from "../../types/sbtc_types.js";

/**
 * Builds and stores commitment transactions for sbtc commit reveal patterns
 */
@Route("/revealer-api/v1/op_drop")
export class OpDropController {
  
  /**
   * Build an sBTC deposit PSBT using OP_RETURN for the user to sign and sed.
   * @param recipient stacks account or contract principle to receive sBTC 
   * @param amountSats amount user wishes to deposit 
   * @param paymentPublicKey public key to spend utxos
   * @param paymentAddress address for utxo - most likely users wallet bitcoin address but does not have to be. 
   * Also used for change address to send deposit from
   * @returns unsigned psbt
   */
  @Post("/get-commitment-address")
  public async getCommitmentAddress(@Body() dd:OpDropRequest): Promise<{commitAddress: string}> {
    try {
      const hashBytes = getHashBytesFromAddress(dd.paymentAddress)
      if (!hashBytes) throw new Error('Payment address is unknown: ' + dd.paymentAddress)
      if (!dd.recipient.startsWith('S')) throw new Error('Recipient is unknown: ' + dd.recipient) 
      const commitment:CommitmentScriptDataType = await buildOpDropDepositTransaction(dd.recipient, dd.amountSats, dd.reclaimPublicKey)
      const sbtcPublicKey = await getCurrentSbtcPublicKey()
      const revealerTx:RevealerTransaction = convertToRevealerTxOpDrop(dd, commitment, sbtcPublicKey)
      await saveOrUpdate(revealerTx.txId, revealerTx)
      return { commitAddress: revealerTx.commitment.address }
    } catch(err) {
      console.error('getPsbtForDeposit: ', err)
      throw new Error(err.message);
    }
  }
}