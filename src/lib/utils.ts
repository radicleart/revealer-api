import * as btc from '@scure/btc-signer';
import { hex } from '@scure/base';
import { getConfig } from './config.js';
import { hashMessage } from '@stacks/encryption';
import { StacksMessageType, publicKeyFromSignatureVrs } from '@stacks/transactions';
import { getStacksAddressFromPubkey } from './transaction/payload_utils.js';

export const REGTEST_NETWORK: typeof btc.NETWORK = { bech32: 'bcrt', pubKeyHash: 0x6f, scriptHash: 0xc4, wif: 0xc4 };
const authMessage = 'Please sign this message to complete authentication'

export function authorised(authorization:any) {
	return true // TODO fixme stacksAddressSig === decoded.stxAddress;
	if (!authorization) return false;
	const decoded = JSON.parse(authorization)
	const stacksAddressSig = stacksAddressFromSignatureHeader(authorization)
	console.log('stacksAddressSig: ' + stacksAddressSig)
	console.log('decoded.stxAddress: ' + decoded.stxAddress)
	return true // TODO fixme stacksAddressSig === decoded.stxAddress;
}
function stacksAddressFromSignatureHeader(authorization:any) {
	const network = getConfig().network
	const decoded = JSON.parse(authorization)
	const msgHash = hashMessage(authMessage);
	const pubkey = publicKeyFromSignatureVrs(hex.encode(msgHash), { data: decoded.signature, type: StacksMessageType.MessageSignature })
	const stacks = getStacksAddressFromPubkey(hex.decode(pubkey))
	if (network === 'testnet') return stacks.tp2pkh
	else return stacks.mp2pkh
}

export function getNet(network:string) {
	let net = btc.TEST_NETWORK;
	if (network === 'devnet') net = REGTEST_NETWORK
	else if (network === 'mainnet') net = btc.NETWORK
	return net;
}

enum StacksNetworkVersion {
	mainnetP2PKH = 22, // 'P'   MainnetSingleSig
	mainnetP2SH = 20, // 'M'    MainnetMultiSig
	testnetP2PKH = 26, // 'T'   TestnetSingleSig
	testnetP2SH = 21, // 'N'    TestnetMultiSig
}

/**
 * Ensure we don't overwrite the original object with Uint8Arrays these can't be serialised to local storage.
 * @param script  
 * @returns 
 */
export function fromStorable(script:any) {
	const clone = JSON.parse(JSON.stringify(script));
	if (typeof script.tweakedPubkey !== 'string') return clone
	return codifyScript(clone, true)
}

/**
 * 
 * @param script
 * @returns 
 */
export function toStorable(script:any) {
	//const copied = JSON.parse(JSON.stringify(script));
	return codifyScript(script, false)
}
  
function codifyScript(script:any, asString:boolean) {
	return {
	  address: script.address,
	  script: codify(script.script, asString),
	  paymentType: (script.type) ? script.type : script.paymentType,
	  witnessScript: codify(script.witnessScript, asString),
	  redeemScript: codify(script.redeemScript, asString),
	  leaves: (script.leaves) ? codifyLeaves(script.leaves, asString) : undefined,
	  tapInternalKey: codify(script.tapInternalKey, asString),
	  tapLeafScript: (script.tapLeafScript) ? codifyTapLeafScript(script.tapLeafScript, asString) : undefined,
	  tapMerkleRoot: codify(script.tapMerkleRoot, asString),
	  tweakedPubkey: codify(script.tweakedPubkey, asString),
	}
}
  
  function codifyTapLeafScript(tapLeafScript:any, asString:boolean) {
	if (tapLeafScript[0]) {
	  const level0 = tapLeafScript[0]
	  if (level0[0]) tapLeafScript[0][0].internalKey = codify(tapLeafScript[0][0].internalKey, asString)
	  if (level0[0]) tapLeafScript[0][0].merklePath[0] = codify(tapLeafScript[0][0].merklePath[0], asString)
	  if (level0[1]) tapLeafScript[0][1] = codify(tapLeafScript[0][1], asString)
	}
	if (tapLeafScript[1]) {
	  const level1 = tapLeafScript[1]
	  if (level1[0]) tapLeafScript[1][0].internalKey = codify(tapLeafScript[1][0].internalKey, asString)
	  if (level1[0]) tapLeafScript[1][0].merklePath[0] = codify(tapLeafScript[1][0].merklePath[0], asString)
	  if (level1[1]) tapLeafScript[1][1] = codify(tapLeafScript[1][1], asString)
	}
	return tapLeafScript;
  }
  
  function codify (arg:unknown, asString:boolean) {
	if (!arg) return;
	if (typeof arg === 'string') {
	  return hex.decode(arg)
	} else {
	  return hex.encode(arg as Uint8Array)
	}
  }
  function codifyLeaves(leaves:any, asString:boolean) {
	if (leaves[0]) {
	  const level1 = leaves[0]
	  if (level1.controlBlock) leaves[0].controlBlock = codify(leaves[0].controlBlock, asString)
	  if (level1.hash) leaves[0].hash = codify(leaves[0].hash, asString)
	  if (level1.script) leaves[0].script = codify(leaves[0].script, asString)
	  if (level1.path && level1.path[0]) leaves[0].path[0] = codify(leaves[0].path[0], asString)
	}
	if (leaves[1]) {
	  const level1 = leaves[1]
	  if (level1.controlBlock) leaves[1].controlBlock = codify(leaves[1].controlBlock, asString)
	  if (level1.hash) leaves[1].hash = codify(leaves[1].hash, asString)
	  if (level1.script) leaves[1].script = codify(leaves[1].script, asString)
	  if (level1.path && level1.path[0]) leaves[1].path[0] = codify(leaves[1].path[0], asString)
	}
	return leaves;
  }
  
  
  