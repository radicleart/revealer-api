import fetch from 'node-fetch';
import { getConfig } from "../../../lib/config.js";

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
export const BASE_URL_NO_WALLET = `http://${getConfig().btcRpcUser}:${getConfig().btcRpcPwd}@${getConfig().btcNode}`;

export const OPTIONS = {
method: "POST",
headers: { 'content-type': 'text/plain' },
body: '' 
};

export async function fetchCurrentFeeRates() {
  try {
    const url = getConfig().blockCypherUrl;
    const response = await fetch(url!);
    const info = await response.json();
    return { feeInfo: { low_fee_per_kb:info.low_fee_per_kb, medium_fee_per_kb:info.medium_fee_per_kb, high_fee_per_kb:info.high_fee_per_kb }};
  } catch (err) {
    console.log(err);
    return { feeInfo: { low_fee_per_kb:20000, medium_fee_per_kb:30000, high_fee_per_kb:40000 }};
  }
}

export async function combinepsbt(b64Psbts:string) {
  const dataString = `{"jsonrpc":"1.0","id":"curltext","method":"combinepsbt","params":["${b64Psbts}"]}`;
  OPTIONS.body = dataString;
  console.log('combinepsbt: ' + dataString)
  try {
    const response = await fetch(BASE_URL_NO_WALLET, OPTIONS);
    const result = await response.json();
    return result.result;
  } catch (err:any) {
    console.log('combinepsbt: err: ', err)
  }
}

export async function decodePSBT(b64Psbt:string) {
  const dataString = `{"jsonrpc":"1.0","id":"curltext","method":"decodepsbt","params":["${b64Psbt}"]}`;
  OPTIONS.body = dataString;
  console.log('decodePSBT: ' + dataString)
  try {
    const response = await fetch(BASE_URL_NO_WALLET, OPTIONS);
    const result = await response.json();
    return result.result;
  } catch (err:any) {
    console.log('decodePSBT: err: ', err)
  }
}

export async function listUnspent() {
  const dataString = `{"jsonrpc":"1.0","id":"curltext","method":"listunspent","params":[3, 6, []]}`;
  OPTIONS.body = dataString;
  const response = await fetch(BASE_URL, OPTIONS);
  await handleError(response, 'Unspent not found');
  const result = await response.json();
  return result.result;
}

export async function validateAddress(address:string) {
  const dataString = `{"jsonrpc":"1.0","id":"curltext","method":"validateaddress","params":["${address}"]}`;
  OPTIONS.body = dataString;
  const response = await fetch(BASE_URL, OPTIONS);
  await handleError(response, 'Unspent not found');
  const result = await response.json();
  return result.result;
}

export async function estimateSmartFee(): Promise<FeeEstimateResponse> {
  const dataString = `{"jsonrpc":"1.0","id":"curltext","method":"estimatesmartfee","params":[6]}`;
  OPTIONS.body = dataString;
  const response = await fetch(BASE_URL, OPTIONS);
  await handleError(response, 'Fee info not found');
  const result = await response.json();
  const feeRate = result.result.feerate * 100000000; // to go to sats
  return {
    feeInfo: {
		  low_fee_per_kb: feeRate / 2,
		  medium_fee_per_kb: feeRate,
		  high_fee_per_kb: feeRate * 2
	  }
  };
}

export async function listReceivedByAddress() {
  const dataString = `{"jsonrpc":"1.0","id":"curltext","method":"listreceivedbyaddress","params":[3, false, true]}`;
  OPTIONS.body = dataString;
  const response = await fetch(BASE_URL, OPTIONS);
  await handleError(response, 'Receive by address error: ');
  const result = await response.json();
  return result.result;
}

export async function listWallets() {
  const dataString = `{"jsonrpc":"1.0","id":"curltext","method":"listwallets","params":[]}`;
  OPTIONS.body = dataString;
  const response = await fetch(BASE_URL, OPTIONS);
  await handleError(response, 'loadWallet internal error');
  const result = await response.json();
  return result;
}

export async function unloadWallet(name:string) {
  const dataString = `{"jsonrpc":"1.0","id":"curltext","method":"unloadwallet","params":["${name}"]}`;
  OPTIONS.body = dataString;
  const response = await fetch(BASE_URL, OPTIONS);
  await handleError(response, 'loadWallet internal error');
  const result = await response.json();
  return result;
}

export async function loadWallet(name:string) {
  const dataString = `{"jsonrpc":"1.0","id":"curltext","method":"loadwallet","params":["${name}"]}`;
  OPTIONS.body = dataString;
  const response = await fetch(BASE_URL, OPTIONS);
  await handleError(response, 'loadWallet internal error');
  const result = await response.json();
  return result.result;
}

export async function walletProcessPsbt(psbtHex:string) {
  const dataString = `{"jsonrpc":"1.0","id":"curltext","method":"walletprocesspsbt","params":["${psbtHex}"]}`;
  OPTIONS.body = dataString;
  const response = await fetch(BASE_URL, OPTIONS);
  await handleError(response, 'getAddressInfo internal error');
  const result = await response.json();
  return result.result;
}

export async function getTxOut(txid:string, vout:number) {
  const dataString = `{"jsonrpc":"1.0","id":"curltext","method":"gettxout","params":["${txid}", ${vout}]}`;
  OPTIONS.body = dataString;
  const response = await fetch(BASE_URL, OPTIONS);
  await handleError(response, 'getTxOut internal error: ' + txid + ':' + vout);
  const result = await response.json();
  return result.result;
}

export async function getAddressInfo(address:string) {
  const dataString = `{"jsonrpc":"1.0","id":"curltext","method":"getaddressinfo","params":["${address}"]}`;
  OPTIONS.body = dataString;
  const response = await fetch(BASE_URL, OPTIONS);
  await handleError(response, 'getAddressInfo internal error: ' + address);
  const result = await response.json();
  return result.result;
}

export async function importAddress(address:string) {
  const dataString = `{"jsonrpc":"1.0","id":"curltext","method":"importaddress","params":["${address}"]}`;
  OPTIONS.body = dataString;
  const response = await fetch(BASE_URL, OPTIONS);
  await handleError(response, 'importAddress internal error: ' + address);
  const result = await response.json();
  return result.result;
}

export async function importPubkey(pubkey:string) {
  const dataString = `{"jsonrpc":"1.0","id":"curltext","method":"importpubkey","params":["${pubkey}"]}`;
  OPTIONS.body = dataString;
  const response = await fetch(BASE_URL, OPTIONS);
  await handleError(response, 'importPubkey internal error: ' + pubkey);
  const result = await response.json();
  return result.result;
}

export async function getWalletInfo(pubkey:string) {
  const dataString = `{"jsonrpc":"1.0","id":"curltext","method":"getwalletinfo","params":[]}`;
  OPTIONS.body = dataString;
  const response = await fetch(BASE_URL, OPTIONS);
  await handleError(response, 'getWalletInfo internal error: ' + pubkey);
  const result = await response.json();
  return result.result;
}

export async function fetchAddressTransactions(address:string, lastId?:string) {
  let url = getConfig().mempoolUrl + '/address/' + address + '/txs';
  if (lastId) url += '/' + lastId
  const response = await fetch(url);
  //if (response.status !== 200) throw new Error('Unable to retrieve utxo set from mempool?');
  const result = await response.json();
  return result;
}

export async function fetchUTXOs(address:string) {
  try {
    const url = getConfig().mempoolUrl + '/address/' + address + '/utxo';
    const response = await fetch(url);
    if (response.status !== 200) throw new Error('Unable to retrieve utxo set from mempool?');
    const result = await response.json();
    return result;
  } catch(err) {
    console.log(err)
    return;
  }
}

export async function fetchRawTx(txid, verbose) {
  let dataString = `{"jsonrpc":"1.0","id":"curltext","method":"getrawtransaction","params":["${txid}", ${verbose}]}`;
  OPTIONS.body = dataString;
  let res;
  try {
      const response = await fetch(BASE_URL, OPTIONS);
      //await handleError(response, 'fetchRawTransaction not found');
      const result = await response.json();
      res = result.result;
  }
  catch (err) { }
  //console.log('fetchRawTx: res1: ', res);
  if (!res) {
      res = await fetchTransaction(txid);
      res.hex = await fetchTransactionHex(txid);
  }
  if (res && verbose) {
      try {
          res.block = await getBlock(res.blockhash, 1);
      }
      catch (err) {
          console.log('Unable to get block info');
      }
  }
  return res;
}

export async function getBlockChainInfo() {
  const dataString = `{"jsonrpc":"1.0","id":"curltext","method":"getblockchaininfo","params":[]}`;
  OPTIONS.body = dataString;
  const response = await fetch(BASE_URL, OPTIONS);
  await handleError(response, 'Receive by address error: ');
  const result = await response.json();
  return result.result;
}
export async function getBlock(hash, verbosity) {
  const dataString = `{"jsonrpc":"1.0","id":"curltext","method":"getblock","params":["${hash}", ${verbosity}]}`;
  OPTIONS.body = dataString;
  const response = await fetch(BASE_URL, OPTIONS);
  await handleError(response, 'getBlock error: ');
  const result = await response.json();
  return result.result;
}
export async function getBlockCount() {
  const dataString = `{"jsonrpc":"1.0","id":"curltext","method":"getblockcount","params":[]}`;
  OPTIONS.body = dataString;
  const response = await fetch(BASE_URL_NO_WALLET, OPTIONS);
  await handleError(response, 'Receive by address error: ');
  const result = await response.json();
  return { count: result.result };
}

export async function fetchTransactionHex(txid:string) {
  try {
    //https://api.blockcypher.com/v1/btc/test3/txs/<txID here>?includeHex=true
    //https://mempool.space/api/tx/15e10745f15593a899cef391191bdd3d7c12412cc4696b7bcb669d0feadc8521/hex
    const url = getConfig().mempoolUrl + '/tx/' + txid + '/hex';
    const response = await fetch(url);
    const hex = await response.text();
    return hex;
  } catch(err) {
    console.log(err)
    return;
  }
}

export async function fetchTransaction(txid:string) {
  try {
    const url = getConfig().mempoolUrl + '/tx/' + txid;
    const response = await fetch(url);
    if (response.status !== 200) throw new Error('Unable to fetch transaction for: ' + txid);
    const tx = await response.json();
    return tx;
  } catch(err) {
    console.log(err)
    return;
  }
}

