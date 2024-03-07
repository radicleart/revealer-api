import { Body, Get, Post, Route } from "tsoa";
import { RevealerTransaction } from "../../types/revealer_types.js";
import { fetchAddressTransactions, getHashBytesFromAddress } from "../../lib/bitcoin_utils.js";
import { countTransactionsByFilter, findOldestTransactionByHeight, findTransactionByCommitAddress, findTransactionByTxId, findTransactionsByFilter, saveOrUpdate } from "./transaction_db.js";
import { scanBySbtcWallet, scanBySbtcWalletTransaction, scanUnpaidTransactions, scanSpecificCommitment, unpaidOpDrop } from "./transactionScanner.js";
import { getPegWalletAddressFromPublicKey } from "../../lib/transaction/wallet_utils.js";
import { getConfig } from "../../lib/config.js";
import { getCurrentSbtcPublicKey } from "../../lib/sbtc_utils.js";

/**
 * Builds and stores commitment transactions for sbtc commit reveal patterns
 */
@Route("/revealer-api/v1/transactions")
export class TransactionController {
  
  /**
   * Fetch historic revealer transactions from an sbtc wallet - does not overwrite existing txs.
   * @param address address of the sbtc wallet to scan
   * @returns array of transactions
   */
  @Get("/scan-sbtc-wallet-transaction/:txid")
  public async scanSbtcWalletTransaction(txid:string): Promise<RevealerTransaction> {
    try {
      return await scanBySbtcWalletTransaction(txid)
    } catch(err) {
      console.error('getCommitmentTransactions: ', err)
      throw new Error(err.message);
    }
  }

  /**
   * Fetch historic revealer transactions from an sbtc wallet - does not overwrite existing txs.
   * @param address address of the sbtc wallet to scan
   * @returns array of transactions
   */
  @Get("/scan-sbtc-wallet-transactions/:address")
  public async scanSbtcWalletTransactions(address:string): Promise<Array<any>> {
    try {
      if (address === 'latest') {
        const sbtcWalletPublicKey = await getCurrentSbtcPublicKey()
        address = getPegWalletAddressFromPublicKey(getConfig().network, sbtcWalletPublicKey)
      }
      const revealerTxs = await findOldestTransactionByHeight() as RevealerTransaction
      let txId = revealerTxs?.[0]?.txId || undefined
      console.log('scanSbtcWalletTransactions: addressTxs: ', txId)
      const addressTxs:Array<any> = await fetchAddressTransactions(address, txId);
      console.log('scanSbtcWalletTransactions: addressTxs: ' + addressTxs?.length || 0)
      scanBySbtcWallet(address, addressTxs)
      return [addressTxs.length]
    } catch(err) {
      console.error('getCommitmentTransactions: ', err)
      throw new Error(err.message);
    }
  }

  /**
   * Fetch transactions at the given address - we only ever expect one - the users deposit.
   * @param address address of the commitment
   * @returns array of transactions
   */
  @Post("/scan-commitment-transactions/:address")
  public async scanRevealerTransactionsByCommitAddress(address:string): Promise<Array<any>> {
    try {
      const hashBytes = getHashBytesFromAddress(address)
      if (!hashBytes) throw new Error('Address is invalid: ' + address)
      const txs = await fetchAddressTransactions(address) 
      return txs
    } catch(err) {
      console.error('getCommitmentTransactions: ', err)
      throw new Error(err.message);
    }
  }

  /**
   * Reads local revealer transactions (initiated from UI) in state 'unpaid'.
   * For op_returns in this state (edge case) the the state is advanced to pending
   * For op_drops in this state the commit address is used to look for transactions
   * ie to see if the user has paid the invoice. If so the internal representation
   * is updated to set the tx_id and to update the status to pending. Pending, in both 
   * cases, means waiting for an the sBTC mint event
   * @returns list of unpaid transactions found or 404 if none
   */
  @Get("/scan-unpaid")
  public async scanUnpaidTransactions(): Promise<any> {
    try {
      const txs = await scanUnpaidTransactions() 
      return txs
    } catch(err) {
      console.error('getCommitmentTransactions: ', err)
      throw new Error(err.message);
    }
  }

  @Get("/check-revealer-transaction/:address")
  public async checkRevealerTransactionByCommitAddress(address): Promise<any> {
    try {
      const revealerTx = await findTransactionByCommitAddress(address)
      return await scanSpecificCommitment(revealerTx)
    } catch(err) {
      console.error('getCommitmentTransactions: ', err)
      throw new Error(err.message);
    }
  }

  @Get("/connect-revealer-transaction/:address/:txId")
  public async connectRevealerTransactionByCommitAddress(address, txId): Promise<any> {
    try {
      const revealerTx = await findTransactionByCommitAddress(address);
      const updatedRevealerTx = await unpaidOpDrop(revealerTx);
      if (updatedRevealerTx.txId !== txId) throw new Error('Tx ids do not match => problem synchronising the transaction.')
      return updatedRevealerTx;
    } catch(err) {
      console.error('getCommitmentTransactions: ', err)
      throw new Error(err.message);
    }
  }


  @Get("/get-revealer-transactions/:page/:limit")
  public async getRevealerTransactions(page:number, limit:number): Promise<any> {
    try {
      const total = await countTransactionsByFilter({})
      const txs = await findTransactionsByFilter({}, page, limit, 'blockHeight')
      return {txs, total}
    } catch(err) {
      console.error('getCommitmentTransactions: ', err)
      throw new Error(err.message);
    }
  }

  @Get("/get-revealer-transactions-by-commit-address/:address")
  public async getRevealerTransactionByCommitAddress(address): Promise<any> {
    try {
      const tx = await findTransactionByCommitAddress(address)
      return tx
    } catch(err) {
      console.error('getCommitmentTransactions: ', err)
      throw new Error(err.message);
    }
  }

  @Get("/get-revealer-transactions-by-txid/:txId")
  public async getRevealerTransactionByTxId(txId): Promise<any> {
    try {
      const tx = await findTransactionByTxId(txId)
      return tx
    } catch(err) {
      console.error('getCommitmentTransactions: ', err)
      throw new Error(err.message);
    }
  }

  @Get("/get-revealer-transactions-by-originator/:address/:page/:limit")
  public async getRevealerTransactionByOriginator(address, page, limit): Promise<any> {
    try {
      const total = await countTransactionsByFilter({'originator': address})
      const txs = await findTransactionsByFilter({'originator': address}, page, limit, 'blockHeight')
      return {txs, total}
    } catch(err) {
      console.error('getCommitmentTransactions: ', err)
      throw new Error(err.message);
    }
  }
  @Get("/get-revealer-transactions-pending-by-originator/:address")
  public async getRevealerTransactionPendingByOriginator(address): Promise<any> {
    try {
      const txs = await findTransactionsByFilter({'originator': address, status: {$lt: 2}}, 0, 100, 'blockHeight')
      return txs
    } catch(err) {
      console.error('getCommitmentTransactions: ', err)
      throw new Error(err.message);
    }
  }
}