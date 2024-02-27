import * as secp from '@noble/secp256k1';
import * as btc from '@scure/btc-signer';
import { hex } from '@scure/base';
import { schnorr } from '@noble/curves/secp256k1';
import { CommitKeysI } from 'sbtc-bridge-lib';
import { UTXO } from '../../types/revealer_types';

const privKey = hex.decode('0101010101010101010101010101010101010101010101010101010101010101');
const priv = secp.utils.randomPrivateKey()

export const REGTEST_NETWORK: typeof btc.NETWORK = { bech32: 'bcrt', pubKeyHash: 0x6f, scriptHash: 0xc4, wif: 0xc4 };

export function getNet(network:string) {
	let net = btc.TEST_NETWORK;
	if (network === 'devnet') net = REGTEST_NETWORK
	else if (network === 'mainnet') net = btc.NETWORK
	return net;
}

type KeySet = {
	priv: Uint8Array,
	ecdsaPub: Uint8Array,
	schnorrPub: Uint8Array
}

const keySetForFeeCalculation: KeySet[] = []
keySetForFeeCalculation.push({
  priv,
  ecdsaPub: secp.getPublicKey(priv, true),
  schnorrPub: secp.getPublicKey(priv, false)
})

const testWallets = [
	{
		"privateKey": "ad1195070a559967782fb6eaa622a2baeaed9d9d254880059f9fbf781cf7852c",
		"ecdsaPub": "0235bbcc0b6898fc63d6e856c10b67490b153f8866a88b7e59b2229fb2dc9cf102",
		"schnorrPub": "0435bbcc0b6898fc63d6e856c10b67490b153f8866a88b7e59b2229fb2dc9cf102369bdef88e0c63b560a7d5295347e6dc6cd9d2158a8edc906ba09ac1019db0f8",
	},
	{
		"privateKey": "b3fd3a7216621aa796270da8149298a6f1cbf2eba4a4fc3cc21725f289d2551d",
		"ecdsaPub": "0235bbcc0b6898fc63d6e856c10b67490b153f8866a88b7e59b2229fb2dc9cf102",
		"schnorrPub": "0435bbcc0b6898fc63d6e856c10b67490b153f8866a88b7e59b2229fb2dc9cf102369bdef88e0c63b560a7d5295347e6dc6cd9d2158a8edc906ba09ac1019db0f8"
	}
]
export const sbtcWallets = [
	{
		"sbtcAddress": "tb1pf74xr0x574farj55t4hhfvv0vpc9mpgerasawmf5zk9suauckugqdppqe8",
		"pubKey": "264bd0d3bd80ea2da383b0a2a29f53d258e05904d2279f5f223053b987a3fd56",
		"desc": "tr([760ce8cf/86'/1'/0'/0/1]264bd0d3bd80ea2da383b0a2a29f53d258e05904d2279f5f223053b987a3fd56)#j4wq04cw",
		"parent_desc": "tr([760ce8cf/86'/1'/0']tpubDDQtKohNhMryjsYgQu8hsZ1BMXJWb1h4xGDZvsQV5ZK9E5QDNgp3w1h9N2XTyz6GVDmMcbAw5YU67mcGousktHxjVTx6RmqXX6GfJJrkqqh/0/*)#kqt0kevz",
		"scriptPubKey": "51204faa61bcd4f553d1ca945d6f74b18f60705d85191f61d76d34158b0e7798b710",
		"witness_program": "4faa61bcd4f553d1ca945d6f74b18f60705d85191f61d76d34158b0e7798b710",
	},
	{
		"sbtcAddress": "tb1pmmkznvm0pq5unp6geuwryu2f0m8xr6d229yzg2erx78nnk0ms48sk9s6q7",
		"pubKey": "802fb08c62f33a5e074dae2fc19441e7cef96c6e5a1ffa4065e5f7a8423816a3",
		"desc": "tr([7e0bf729/86'/1'/0'/0/2]802fb08c62f33a5e074dae2fc19441e7cef96c6e5a1ffa4065e5f7a8423816a3)#d8elhne5",
		"parent_desc": "tr([7e0bf729/86'/1'/0']tpubDCzcBRDqD1G23fAdF79sTfdECnfRprb5uGKb9vKBxrH4uZbC46ZJmxtSdYHwEJykzuzZV3KUGtFSRaoNAJuZpRSCiKoC1FUxkmRjPjDrbSA/0/*)#a8uhq8yj",	
		"scriptPubKey": "5120deec29b36f0829c98748cf1c3271497ece61e9aa5148242b23378f39d9fb854f",
		"witness_program": "deec29b36f0829c98748cf1c3271497ece61e9aa5148242b23378f39d9fb854f",
	}
]
/**
 * Constructs the script hash with script paths corresponding to two internal
 * test wallets.
 */
export function getTestAddresses (network:string):CommitKeysI {
	const net = getNet(network);
	return {
		fromBtcAddress: btc.getAddress('tr', hex.decode(testWallets[0].privateKey), net) as string,
		sbtcWalletAddress: sbtcWallets[0].sbtcAddress,
		//reveal: btc.getAddress('tr', hex.decode(testWallets[0].privateKey), net) as string,
		revealPub: hex.encode(schnorr.getPublicKey(testWallets[0].privateKey) as Uint8Array),
		//revealPrv: testWallets[0].privateKey,
		//reclaim: btc.getAddress('tr', hex.decode(testWallets[1].privateKey), net) as string,
		reclaimPub: hex.encode(schnorr.getPublicKey(testWallets[1].privateKey) as Uint8Array),
		//reclaimPrv: testWallets[1].privateKey,
		stacksAddress: (network === 'testnet') ? 'ST1RBP62PR532FWVP7JRGC9SVFKKHD1JYK23KYNN0' : 'unsupported'
	}
}

// Address from a 33 byte public key (returns the pub key if schnorr pub key passed in)
export function addressFromPubkey(network:string, pubkey:Uint8Array) {
	const net = getNet(network);
	try {
		return btc.Address(net).encode(btc.OutScript.decode(pubkey));
	} catch(err) {
		console.error('needs to be a 33 byte public key - doesnot work for schnorr pub keys.')
		return hex.encode(pubkey)
	}
}

export function checkAddressForNetwork(net:string, address:string|undefined) {
	if (!address || typeof address !== 'string') throw new Error('No address passed')
    if (address.length < 10) throw new Error('Address is undefined')
	if (net === 'devnet') return
	if (net === 'testnet') {
	  if (address.startsWith('bc')) throw new Error('Mainnet address passed to testnet app: ' + address)
	  else if (address.startsWith('3')) throw new Error('Mainnet address passed to testnet app: ' + address)
	  else if (address.startsWith('1')) throw new Error('Mainnet address passed to testnet app: ' + address)
	  else if (address.startsWith('SP') || address.startsWith('sp')) throw new Error('Mainnet stacks address passed to testnet app: ' + address)
	} else {
	  if (address.startsWith('tb')) throw new Error('Testnet address passed to testnet app: ' + address)
	  else if (address.startsWith('2')) throw new Error('Testnet address passed to testnet app: ' + address)
	  else if (address.startsWith('m')) throw new Error('Testnet address passed to testnet app: ' + address)
	  else if (address.startsWith('n')) throw new Error('Testnet address passed to testnet app: ' + address)
	  else if (address.startsWith('ST') || address.startsWith('st')) throw new Error('Testnet stacks address passed to testnet app: ' + address)
	}
  }
  
  /**
 * 
 * @param amount - if deposit this is the amount the user is sending. Note: 0 for withdrawals
 * @param revealPayment - if op drop this is the gas fee for the reveal tx
 * @param tx - the to add input to
 * @param feeCalc - true if called for the purposes of calculating the fee (i.e. okay to sign inputs with internal key)
 * @param utxos - the utxos being spent from
 * @param paymentPublicKey - pubkey used in script hash payments
export function addInputs (network:string, amount:number, revealPayment:number, tx:btc.Transaction, feeCalc:boolean, utxos:Array<UTXO>, paymentPublicKey:string, userSchnorrPubKey:string) {
	const bar = revealPayment + amount;
	let amt = 0;
	for (const utxo of utxos) {
		const hexy = (utxo.tx.hex) ? utxo.tx.hex : utxo.tx 
		const script = btc.RawTx.decode(hex.decode(hexy))
		if (amt < bar && utxo.status.confirmed) {
			amt += utxo.value;
			//const pubkey = '0248159447374471c5a6cfa18c296e6e297dbf125a9e6792435a87e80c4f771493'
			//const script1 = (btc.p2ms(1, [hex.decode(pubkey)]))
			const txType = utxo.tx.vout[utxo.vout].scriptPubKey.type;
			if (txType === 'scripthash') {
				// educated guess at the p2sh wrapping based on the type of the other (non change) output...
				let wrappedType = ''
				if (utxo.vout === 1) {
					wrappedType = utxo.tx.vout[0].scriptPubKey.type
				} else {
					wrappedType = utxo.tx.vout[1].scriptPubKey.type
				}
				const net = (network === 'testnet') ? btc.TEST_NETWORK : btc.NETWORK;
				let p2shObj;
				if (wrappedType === 'witness_v0_keyhash') {
					p2shObj = btc.p2sh(btc.p2wpkh(hex.decode(paymentPublicKey)), net)
				} else if (wrappedType === 'witness_v1_taproot') {
					p2shObj = btc.p2sh(btc.p2tr(hex.decode(userSchnorrPubKey)), net)
				} else if (wrappedType.indexOf('multi') > -1) {
					p2shObj = btc.p2sh(btc.p2ms(1, [hex.decode(paymentPublicKey)]), net)
				} else {
					p2shObj = btc.p2sh(btc.p2pkh(hex.decode(paymentPublicKey)), net)
				}
				const nextI:btc.TransactionInput = {
					txid: hex.decode(utxo.txid),
					index: utxo.vout,
					nonWitnessUtxo: hexy,
					redeemScript: p2shObj.redeemScript
				}
				tx.addInput(nextI);
			} else {
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
				tx.addInput(nextI);
			}
		}
	}
}
 */
export function addInputs (network:string, amount:number, txFee:number, transaction:btc.Transaction, feeCalc:boolean, utxos:Array<UTXO>, paymentPublicKey:string) {
	const net = getNet(network);
	const bar = txFee + amount;
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

function isUTXOConfirmed (utxo:any) {
	return utxo.tx.confirmations >= 3;
};

export function inputAmt (tx:btc.Transaction) {
	let amt = 0;
	for (let idx = 0; idx < tx.inputsLength; idx++) {
		const inp = tx.getInput(idx)
		if (inp.witnessUtxo) amt += Number(tx.getInput(idx).witnessUtxo?.amount)
		else if (inp.nonWitnessUtxo) amt += Number(inp.nonWitnessUtxo.outputs[inp.index!].amount)
	}
	return amt;
}

/**
 * 
 * @param pubkey 
 * @returns 
 */
export function toXOnly(pubkey: string): string {
    return hex.encode(hex.decode(pubkey).subarray(1, 33))
}

/**
 * 
 * @param network 
 * @param sbtcWalletPublicKey 
 * @returns 
 */
export function getPegWalletAddressFromPublicKey (network:string, sbtcWalletPublicKey:string) {
	if (!sbtcWalletPublicKey) return
	let net = getNet(network);
	//if (network === 'development' || network === 'simnet') {
	//	net = { bech32: 'bcrt', pubKeyHash: 0x6f, scriptHash: 0xc4, wif: 0 }
	//}
	const fullPK = hex.decode(sbtcWalletPublicKey);
	let xOnlyKey = fullPK;
	if (fullPK.length === 33) {
		xOnlyKey = fullPK.subarray(1)
	}
	//const addr = btc.Address(net).encode({type: 'tr', pubkey: xOnlyKey})
	const trObj = btc.p2tr(xOnlyKey, undefined, net);
	return trObj.address;
}
