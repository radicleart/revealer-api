import { Get, Route } from "tsoa";
import { getConfig } from "../../../lib/config.js";
import { fetchCurrentFeeRates as fetchCurrentFeeRatesCypher, estimateSmartFee, fetchAddressTransactions, fetchRawTx, fetchUTXOs, getAddressInfo, getBlockChainInfo, getBlockCount, listWallets, loadWallet, unloadWallet, validateAddress, walletProcessPsbt, getTxOut } from "./rpc_wallet.js";
import * as btc from '@scure/btc-signer';
import { hex } from '@scure/base';
import { sendRawTxDirectBlockCypher, sendRawTxDirectMempool } from "./MempoolApi.js";
import { sendRawTxRpc } from "./BitcoinRpc.js";
import { SignRequestI } from "../../../types/loans.js";

export interface FeeEstimateResponse {
    feeInfo: {
        low_fee_per_kb:number;
        medium_fee_per_kb:number;
        high_fee_per_kb:number;
    };
}

export async function handleError (response:any, message:string) {
  if (response?.status !== 200) {
    const result = await response.json();
    console.log('==========================================================================');
    if (result?.error?.code) console.log(message + ' : ' + result.error.code + ' : ' + result.error.message);
    else console.log(message, result.error);
    console.log('==========================================================================');
    throw new Error(message);
  }
}

export const BASE_URL = `http://${getConfig().btcRpcUser}:${getConfig().btcRpcPwd}@${getConfig().btcNode}${getConfig().walletPath}`;

export const OPTIONS = {
  method: "POST",
  headers: { 'content-type': 'text/plain' },
  body: '' 
};
 
@Route("/uasu-api/:network/v1/btc/wallet")
export class WalletController {
  
  public async validateAddress(address:string): Promise<any> {
    const result = await validateAddress(address);
    return result;
  }

  //@Get("/sign-inputs")
  public async signInputs(partial:SignRequestI): Promise<any> {
    const transaction = btc.Transaction.fromPSBT(hex.decode(partial.psbt), { allowUnknowInput: true, allowUnknowOutput: true, allowUnknownInputs:true, allowUnknownOutputs:true })
    const key = getConfig().btcSchnorrReveal
    for (const indx of partial.inputs) {
      console.log('Signing index: ' + indx + ' with: ' + key)
      transaction.signIdx(hex.decode(key), indx)
    }
    return { txHex: hex.encode(transaction.toPSBT()) };
  }
  public async getUnspentOutput(txid:string, vout:number): Promise<any> {
    const result = await getTxOut(txid, vout);
    return result;
  }

  //@Post("/walletprocesspsbt")
  public async processPsbt(psbtHex:string): Promise<any> {
    const result = await walletProcessPsbt(psbtHex);
    return result;
  }

  @Get("/address/:address/txs")
  public async fetchAddressTransactions(address:string): Promise<any> {
    const result = await fetchAddressTransactions(address);
    return result;
  }

  //@Get("/address/:address/utxos?verbose=true")
  public async fetchUtxoSet(address:string, verbose:boolean): Promise<any> {
    let result;
    try {
      result = await getAddressInfo(address);
      const addressValidation = await validateAddress(address);
      result.addressValidation = addressValidation
    } catch (err:any) {
      console.log('fetchUtxoSet: addressValidation: ' + address + ' : ' + err.message)
      // carry on
    }
    try {
      //console.log('fetchUtxoSet1:', result)
      const utxos = await fetchUTXOs(address);
      //console.log('fetchUtxoSet2:', utxos)
      for (let utxo of utxos) {
        const tx = await fetchRawTx(utxo.txid, verbose);
        //console.log('fetchUtxoSet3:', tx)
        utxo.tx = tx;
      }
      result.utxos = utxos
    } catch (err:any) {
      console.log('fetchUtxoSet: fetchUTXOs: ' + address + ' : ' + err.message)
      // carry on
    }
    return result;
  }
  @Get("/loadwallet/:name")
  public async loadWallet(name:string): Promise<any> {
    const wallets = await listWallets();
    for (const wallet in wallets) {
      try {
        await unloadWallet(name);
      } catch(err:any) {
        console.error('wallet: ' + name + ' : ' + err.message)
      }
    }
    const result = await loadWallet(name);
    return result;
  }
  @Get("/listwallets")
  public async listWallets(): Promise<any> {
    const result = await listWallets();
    return result;
  }
}
@Route("/uasu-api/:network/v1/btc/blocks")
export class BlocksController {

  public async sendRawTransaction(hex:string, maxFeeRate:number): Promise<any> {
    try {
      const resp =  await sendRawTxRpc(hex, maxFeeRate);
      if (resp && resp.error && resp.error.code) {
        if (resp.error.code === -27) { // Transaction already in block chain
          return resp;
        }
        console.log('sendRawTransaction:sendRawTxRpc: ', resp)
        throw new Error('Local rpc call failed.. try external service')
      }
      console.log('sendRawTransaction 1: bitcoin core:', resp);
      return resp;
    } catch (err) {
      try {
        console.log('sendRawTransaction 2: rpc error: ', err);
        console.log('sendRawTransaction 2: trying mempool: ');
        const resp = await sendRawTxDirectMempool(hex);
        console.log('sendRawTransaction 2: sendRawTxDirectMempool: ', resp);
        return resp;
      } catch (err) {
        console.log('sendRawTransaction 3: mempool error: ', err);
        const resp = await sendRawTxDirectBlockCypher(hex);
        console.log('sendRawTransaction 3: sendRawTxDirectBlockCypher: ', resp);
        return resp;
      }
    }
  }


  @Get("/fee-estimate")
  public async getFeeEstimate(): Promise<FeeEstimateResponse> {
    try {
      return fetchCurrentFeeRatesCypher();
    } catch(err) {
      return estimateSmartFee();
    }
  }
  
  @Get("/info")
    public async getInfo(): Promise<any> {
      return getBlockChainInfo();
  }
  @Get("/count")
    public async getCount(): Promise<any> {
      return getBlockCount();
  }
}

export class DefaultController {
    public getFeeEstimate(): string {
      return "Welcome to Ordical API...";
    }
}