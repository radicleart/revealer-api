import { Body, Get, Post, Route } from "tsoa";
import { hex } from '@scure/base';
import { getConfig } from "../../lib/config.js";
import { fetchTransactionHex } from "../../lib/bitcoin_utils.js";
import { buildDepositPayload, buildDepositPayloadOpDrop, buildWithdrawPayload, buildWithdrawPayloadOpDrop, parseDepositPayload, parsePayloadFromTransaction, parseRawPayload, parseWithdrawPayload } from "../../lib/transaction/payload_utils.js";
import { PayloadType } from "sbtc-bridge-lib";

/**
 * Builds and stores commitment transactions for sbtc commit reveal patterns
 */
@Route("/revealer-api/v1/payload")
export class PayloadController {
  
  /**
   * Builds the sBTC deposit data for the op_return variant of the protocol.
   * Returns the hex encoded data as a string.
   * @stxAddress: address or contract principal that is the destination of the deposit 
   * For complete definition @see https://github.com/stacks-network/sbtc/blob/main/sbtc-core/src/operations/op_return/deposit.rs
   */
  @Get("/build/deposit/:stxAddress")
  public commitDepositData(stxAddress:string): string {
    const data = buildDepositPayload(getConfig().network, stxAddress);
		return data;
  }
  
  /**
   * Builds the sBTC deposit data for the op_drop variant of the protocol.
   * Returns the hex encoded data as a string.
   * @stxAddress: address or contract principal that is the destination of the deposit 
   * @revealFee: the fee needed to cover the reveal transaction that the stackers need to spend this deposit 
   * For complete definition @see https://github.com/stacks-network/sbtc/blob/main/sbtc-core/src/operations/op_return/deposit.rs
   */
  @Get("/build/deposit/op_drop/:stxAddress/:revealFee")
  public commitDepositDataOpDrop(stxAddress:string, revealFee:number): string {
    const data = buildDepositPayloadOpDrop(getConfig().network, stxAddress, revealFee);
		return data;
  }
  
  /**
   * Parses the sBTC withdraw request data.
   * Returns the hex encoded data as a string.
   * @data: the encoded deposit data 
   * For complete definition @see https://github.com/stacks-network/sbtc/blob/main/sbtc-core/src/operations/op_return/deposit.rs
   */
  @Get("/parse/deposit/:data")
  public commitDeposit(data:string): PayloadType {
    const payload = parseDepositPayload(hex.decode(data));
		return payload;
  }
  
  /**
   * Builds the sBTC withdraw request data for the op_return variant of the protocol.
   * Returns the hex encoded data as a string.
   * @signature: the users signature that proves they control the owning address  
   * @amount: the amount of sBTC to withdraw 
   * For complete definition @see https://github.com/stacks-network/sbtc/blob/main/sbtc-core/src/operations/op_return/withdrawal_request.rs
   */
  @Get("/build/withdrawal/:signature/:amount")
  public commitWithdrawalData(signature:string, amount:number): string {
    const data = buildWithdrawPayload(getConfig().network, amount, signature);
		return data
  }
  
  /**
   * Builds the sBTC withdraw request data for the op_drop variant of the protocol.
   * Returns the hex encoded data as a string.
   * @signature: the users signature that proves they control the owning address  
   * @amount: the amount of sBTC to withdraw 
   * For complete definition @see https://github.com/stacks-network/sbtc/blob/main/sbtc-core/src/operations/op_return/withdrawal_request.rs
   */
  @Get("/build/withdrawal/op_drop/:signature/:amount")
  public commitWithdrawalDataOpDrop(signature:string, amount:number): string {
    const data = buildWithdrawPayloadOpDrop(getConfig().network, amount, signature);
		return data
  }
  
  /**
   * Parses the sBTC withdraw request data.
   * Returns the hex encoded data as a string.
   * @data: the encoded deposit data 
   * @sbtcWallet: the current sbtc wallets taproot address 
   * For complete definition @see https://github.com/stacks-network/sbtc/blob/main/sbtc-core/src/operations/op_return/withdrawal_request.rs
   */
  @Get("/parse/withdrawal/:data/:bitcoinAddress")
  public parsePayloadWithdrawal(data:string, bitcoinAddress:string): PayloadType {
    const payload = parseWithdrawPayload(getConfig().network, data, bitcoinAddress, 'vrs');
		return payload;
  }
  

  @Get("/parse/:data/:bitcoinAddress")
  public parsePayload(data:string, bitcoinAddress:string): PayloadType {
    const payload = parseRawPayload(getConfig().network, data, bitcoinAddress, 'vrs');
		return payload;
  }
  

  @Get("/parse/tx/:txid")
  public async parseTransaction(txid:string): Promise<PayloadType> {
    const txHex = await fetchTransactionHex(txid);
    let payload:PayloadType = await parsePayloadFromTransaction(getConfig().network, txHex);
    return payload;
    }
}