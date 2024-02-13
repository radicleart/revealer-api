import * as secp from '@noble/secp256k1';
import * as btc from '@scure/btc-signer';
import { hex } from '@scure/base';
import { getConfig } from './config.js';
import { getNet } from './utils.js';
import { UTXO } from '../types/revealer_types.js';

const privKey = hex.decode('0101010101010101010101010101010101010101010101010101010101010101');
export const BASE_URL = `http://${getConfig().btcRpcUser}:${getConfig().btcRpcPwd}@${getConfig().btcNode}${getConfig().walletPath}`;

export const OPTIONS = {
  method: "POST",
  headers: { 'content-type': 'text/plain' },
  body: '' 
};

export async function fetchUtxoSet(address:string, verbose:boolean): Promise<any> {
    let result:any = {};
	/**
	if (address) {
        try {
          result = await bitcoinCoreAddressInfo(address);
          const addressValidation = await bitcoinCoreValidateAddress(address);
          result.addressValidation = addressValidation
        } catch (err:any) {
          console.error('fetchUtxoSet: addressValidation: ' + address + ' : ' + err.message)
        }
    }
	 */
    try {
      const utxos = await mempoolFetchUTXOs(address);
      for (let utxo of utxos) {
		const res = await mempoolFetchTransaction(utxo.txid);
		if (verbose) res.hex = await mempoolFetchTransactionHex(utxo.txid);
		utxo.tx = res;
      }
      result.utxos = utxos
    } catch (err:any) {
      console.error('fetchUtxoSet: fetchUTXOs: ' + address + ' : ' + err.message)
      // carry on
    }
    return result;
}
  
async function fetchTransaction(txid:string, verbose:boolean) {
	let dataString = `{"jsonrpc":"1.0","id":"curltext","method":"getrawtransaction","params":["${txid}", ${verbose}]}`;
	OPTIONS.body = dataString; 
	let res;
	try {
	  const response = await fetch(BASE_URL, OPTIONS);
	  const result = await response.json();
	  res = result.result;
	} catch (err) {}
	if (!res) {
	  res = await mempoolFetchTransaction(txid);
	  if (verbose) res.hex = await mempoolFetchTransactionHex(txid);
	}
	return res;
}
  
export async function fetchAddressTransactions(address:string, lastId?:string) {
	let url = getConfig().mempoolUrl + '/address/' + address + '/txs';
	if (lastId) url += '/' + lastId
	const response = await fetch(url);
	const result = await response.json();
	return result;
}
  
/**
 * getAddressFromOutScript converts a script to an address
 * @param network:string 
 * @param script: Uint8Array 
 * @returns address as string
 */
export function getAddressFromOutScript(network:string, script: Uint8Array):string {
	const net = getNet(network);
	const outputScript = btc.OutScript.decode(script);
  
	if (outputScript.type === 'pk' || outputScript.type === 'tr') {
	  return btc.Address(net).encode({
		type: outputScript.type,
		pubkey: outputScript.pubkey,
	  });
	}
	if (outputScript.type === 'ms' || outputScript.type === 'tr_ms') {
	  return btc.Address(net).encode({
		type: outputScript.type,
		pubkeys: outputScript.pubkeys,
		m: outputScript.m,
	  });
	}
	if (outputScript.type === 'tr_ns') {
	  return btc.Address(net).encode({
		type: outputScript.type,
		pubkeys: outputScript.pubkeys,
	  });
	}
	if (outputScript.type === 'unknown') {
	  return btc.Address(net).encode({
		type: outputScript.type,
		script,
	  });
	}
	return btc.Address(net).encode({
	  type: outputScript.type,
	  hash: outputScript.hash,
	});
}

export function getTaprootAddressFromPublicKey (network:string, publicKey:string) {
	if (!publicKey) return
	let net = getNet(network);
	const fullPK = hex.decode(publicKey);
	let xOnlyKey = fullPK;
	if (fullPK.length === 33) {
		xOnlyKey = fullPK.subarray(1)
	}
	//const addr = btc.Address(net).encode({type: 'tr', pubkey: xOnlyKey})
	const trObj = btc.p2tr(xOnlyKey, undefined, net);
	return trObj.address;
}

export function inputAmt (tx:btc.Transaction) {
	let amt = 0;
	for (let idx = 0; idx < tx.inputsLength; idx++) {
		const inp = tx.getInput(idx)
		if (inp.witnessUtxo) amt += Number(tx.getInput(idx).witnessUtxo?.amount)
		else if (inp.nonWitnessUtxo) amt += Number(inp.nonWitnessUtxo.outputs[inp.index!].amount)
	}
	return amt;
}

export function addInputs (network:string, amount:number, revealPayment:number, transaction:btc.Transaction, feeCalc:boolean, utxos:Array<UTXO>, paymentPublicKey:string) {
	const net = getNet(network);
	const bar = revealPayment + amount;
	let amt = 0;
	for (const utxo of utxos) {
		const hexy = (utxo.tx.hex) ? utxo.tx.hex : utxo.tx
		const script = btc.RawTx.decode(hex.decode(hexy))
		if (amt < bar && utxo.status.confirmed) {
			const txFromUtxo = btc.Transaction.fromRaw(hex.decode(hexy), {allowUnknowInput:true, allowUnknowOutput: true, allowUnknownOutputs: true, allowUnknownInputs: true})
			const outputToSpend = txFromUtxo.getOutput(utxo.vout)
			if (!outputToSpend || !outputToSpend.script) throw new Error('no script passed ?')
			const spendScr = btc.OutScript.decode(outputToSpend.script)
			//const addr = getAddressFromOutScript(output.script)
			if (spendScr.type === 'sh') {
				let p2shObj;
				// p2tr cannont be wrapped in p2sh !!!
				for (let i = 0; i < 10; i++) {
					try {
						if (i === 0) {
							p2shObj = btc.p2sh(btc.p2wpkh(hex.decode(paymentPublicKey)), net)
						} else if (i === 1) {
							p2shObj = btc.p2sh(btc.p2wsh(btc.p2wpkh(hex.decode(paymentPublicKey))), net)
						} else if (i === 2) {
							p2shObj = btc.p2sh(btc.p2wsh(btc.p2pkh(hex.decode(paymentPublicKey)), net))
						} else if (i === 3) {
							p2shObj = btc.p2sh(btc.p2ms(1, [hex.decode(paymentPublicKey)]), net)
						} else if (i === 4) {
							p2shObj = btc.p2sh(btc.p2pkh(hex.decode(paymentPublicKey)), net)
						} else if (i === 5) {
							p2shObj = btc.p2sh(btc.p2sh(btc.p2pkh(hex.decode(paymentPublicKey)), net))
						} else if (i === 6) {
							p2shObj = btc.p2sh(btc.p2sh(btc.p2wpkh(hex.decode(paymentPublicKey)), net))
						}
						if (i < 3) {
							const nextI = redeemAndWitnessScriptAddInput(utxo, p2shObj, hexy)
							transaction.addInput(nextI);
						} else {
							const nextI = redeemScriptAddInput(utxo, p2shObj, hexy)
							transaction.addInput(nextI);
						}
						//('Tx type: ' + i + ' --> input added')
						break;
					} catch (err:any) {
						console.log('Error: not tx type: ' + i);
					}
				}
			} else if (spendScr.type === 'wpkh') {
				const spendAddr = getAddressFromOutScript(network, outputToSpend.script)
				//console.log('spendAddr: ' + spendAddr)
				const nextI:btc.TransactionInput = {
					txid: hex.decode(utxo.txid),
					index: utxo.vout,
					...outputToSpend,
					witnessUtxo: {
					  script: outputToSpend.script,
					  amount: BigInt(utxo.value),
					},
				}
				try {
					transaction.addInput(nextI);
				} catch(err:any) {
					// try next input
					console.log(err)
				}
			} else if (spendScr.type === 'wsh') {
				//const p2shObj = btc.p2wsh(btc.p2wpkh(hex.decode(paymentPublicKey), net))
				let witnessUtxo = {
					script: script.outputs[utxo.vout].script,
					amount: BigInt(utxo.value)
				}
				if (feeCalc) {
					witnessUtxo = {
						amount: BigInt(utxo.value),
						script: btc.p2wpkh(secp.getPublicKey(privKey, true)).script,
					}
				}
				const nextI:btc.TransactionInput = {
					txid: hex.decode(utxo.txid),
					index: utxo.vout,
					nonWitnessUtxo: hexy,
					witnessUtxo
				}
				try {
					transaction.addInput(nextI);
				} catch(err:any) {
					// try next input
					console.log(err)
				}
			} else if (spendScr.type === 'pkh') {
				//const p2shObj = btc.p2pkh(hex.decode(paymentPublicKey), net)
				const nextI:btc.TransactionInput = {
					txid: hex.decode(utxo.txid),
					index: utxo.vout,
					nonWitnessUtxo: hexy,
					//witnessUtxo
				}
				try {
					transaction.addInput(nextI);
				} catch(err:any) {
					// try next input
					console.log(err)
				}
			} else {
				//const p2shObj = btc.p2wpkh(hex.decode(paymentPublicKey), net)
				const nextI:btc.TransactionInput = {
					txid: hex.decode(utxo.txid),
					index: utxo.vout,
					nonWitnessUtxo: hexy,
					//witnessUtxo
				}
				try {
					transaction.addInput(nextI);
				} catch(err:any) {
					// try next input
					console.log(err)
				}
			}
			amt += utxo.value;
		}
	}
}

function redeemScriptAddInput (utxo:any, p2shObj:any, hexy:any) {
	return {
		txid: hex.decode(utxo.txid),
		index: utxo.vout,
		nonWitnessUtxo: hexy,
		redeemScript: p2shObj.redeemScript
	}

}

function redeemAndWitnessScriptAddInput (utxo:any, p2shObj:any, hexy:any) {
	return {
		txid: hex.decode(utxo.txid),
		index: utxo.vout,
		witnessUtxo: {
		  script: p2shObj.script,
		  amount: BigInt(utxo.value),
		},
		redeemScript: p2shObj.redeemScript,
	}
}

export async function handleError (response:any, message:string) {
	if (response?.status !== 200) {
	  const result = await response.json();
	  console.error('==========================================================================');
	  if (result?.error?.code) console.log(message + ' : ' + result.error.code + ' : ' + result.error.message);
	  else console.error(message, result.error);
	  console.error('==========================================================================');
	  throw new Error(message);
	}
}
  
async function mempoolFetchTransactionHex(txid:string) {
	try {
	  const url = getConfig().mempoolUrl + '/tx/' + txid + '/hex';
	  const response = await fetch(url);
	  const hex = await response.text();
	  return hex;
	} catch(err) {
	  console.error(err)
	  return;
	}
  }
  
  async function bitcoinCoreAddressInfo(address:string) {
	//checkAddressForNetwork(getConfig().network, address)
	const dataString = `{"jsonrpc":"1.0","id":"curltext","method":"getaddressinfo","params":["${address}"]}`;
	OPTIONS.body = dataString;
	console.log('getAddressInfo: ' + BASE_URL)
	const response = await fetch(BASE_URL, OPTIONS);
	await handleError(response, 'getAddressInfo internal error: ' + address);
	const result = await response.json();
	return result.result;
  }

  async function bitcoinCoreValidateAddress(address:string) {
	//checkAddressForNetwork(getConfig().network, address)
	const dataString = `{"jsonrpc":"1.0","id":"curltext","method":"validateaddress","params":["${address}"]}`;
	OPTIONS.body = dataString;
	const response = await fetch(BASE_URL, OPTIONS);
	await handleError(response, 'Unspent not found');
	const result = await response.json();
	return result.result;
  }
  
  async function mempoolFetchUTXOs(address:string) {
	try {
	  const url = getConfig().mempoolUrl + '/address/' + address + '/utxo';
	  const response = await fetch(url);
	  const result = await response.json();
	  return result;
	} catch(err) {
	  console.log(err)
	  return;
	}
  }

  async function mempoolFetchTransaction(txid:string) {
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
  
