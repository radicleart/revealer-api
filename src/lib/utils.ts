import * as btc from '@scure/btc-signer';
import { hex } from '@scure/base';
import { getConfig } from './config.js';
import { hashMessage } from '@stacks/encryption';
import { StacksMessageType, publicKeyFromSignatureVrs } from '@stacks/transactions';
import { getStacksAddressFromPubkey } from './transaction/payload_utils.js';

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

