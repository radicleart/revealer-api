import { BASE_URL, OPTIONS } from "./bitcoin_utils.js";
import { getConfig } from "./config.js";

export async function broadcastBitcoinTransaction(hex:string, maxFeeRate:number): Promise<any> {
  let resp: any;

  try {
    resp =  await sendRawTxRpc(hex, maxFeeRate);
    if (resp && resp.error && resp.error.code) {
      if (resp.error.code === -27) { // Transaction already in block chain
        return resp;
      }
      throw new Error('Local rpc call failed.. try mempool..')
    }
    console.log('sendRawTransaction 1: bitcoin core: worked');
  } catch (err) {

  console.log('sendRawTransaction 2: trying mempool: ');
  resp = await sendRawTxDirectMempool(hex);
  console.log('sendRawTransaction 2: mempool: worked');
    /**
  try {
    } catch (err) {

      try {
        console.log('sendRawTxDirectMempool 3: mempool error: ' + err.message);
        resp = await sendRawTxDirectBlockCypher(hex);
        console.log('sendRawTransaction 3: block cypher: worked');
      } catch (err:any) {
        throw new Error('sendRawTxDirectBlockCypher: Unable to broadcast this transaction: ')
      }
    }
     */
    return resp;
  }
}

export async function sendRawTxRpc(hex:string, maxFeeRate:number):Promise<any> {
    const dataString = `{"jsonrpc":"1.0","id":"curltext","method":"sendrawtransaction","params":["${hex}", ${maxFeeRate}]}`;
    OPTIONS.body = dataString;
    const response = await fetch(BASE_URL, OPTIONS);
    const result = await response.text();
    return result;
}
    
export async function sendRawTxDirectBlockCypher(hex:string) {
    const url = getConfig().blockCypherUrl + '/txs/push';
    //console.log('sendRawTxDirectBlockCypher: ', url)
    const response = await fetch(url, {
      method: 'POST',
      //headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({tx: hex})
    });
    //if (response.status !== 200) console.log('Mempool error: ' + response.status + ' : ' + response.statusText);
    try {
      return await response.json();
    } catch (err) {
      try {
        console.log(err)
        return await response.text();
      } catch (err1) {
        console.log(err1)
      }
    }
    return 'success';
}

async function sendRawTxDirectMempool(txHex:string) {
    const url = getConfig().mempoolUrl + '/tx';
    console.log('sendRawTxDirectMempool: ', url)
    let result:any;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: txHex //JSON.stringify({txHex})
    });
    try {
      result = await response.text();
    } catch (err) {
      console.error('sendRawTxDirectMempool: mempool err:', err)
      console.error('sendRawTxDirectMempool: mempool txHex: ' + txHex)
      try {
        result = await response.json();
      } catch (err:any) {
        throw new Error('Unable to brodcast via mempool')
      }
    }
    if (response.status !== 200) throw new Error('Mempool error: ' + response.status + ' : ' + result);
    console.log('sendRawTxDirectMempool: ', result)
    return result;
}