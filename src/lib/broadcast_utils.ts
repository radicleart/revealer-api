import { BASE_URL, OPTIONS } from "./bitcoin_utils.js";
import { getConfig } from "./config.js";

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

export async function sendRawTxDirectMempool(hex:string) {
    const url = getConfig().mempoolUrl + '/tx';
    console.log('sendRawTxDirectMempool: ', url)
    const response = await fetch(url, {
      method: 'POST',
      //headers: { 'Content-Type': 'application/json' },
      body: hex
    });
    let result:any;
    if (response.status !== 200) throw new Error('Mempool error: ' + response.status + ' : ' + response.statusText);
    try {
      result = await response.json();
    } catch (err) {
      result = await response.text();
    }
    return result;
}
  