import { getNet } from "sbtc-bridge-lib/dist/wallet_utils";
import * as secp from '@noble/secp256k1';
import * as btc from '@scure/btc-signer';
import { hex } from '@scure/base';
import { schnorr } from '@noble/curves/secp256k1';
import { c32address, c32addressDecode } from 'c32check';
import * as P from 'micro-packed';

const concat = P.concatBytes;

export const MAGIC_BYTES_TESTNET = '5432';
export const MAGIC_BYTES_MAINNET = '5832';
export const PEGIN_OPCODE = '3C';
export const PEGOUT_OPCODE = '3E';

export function buildDepositPayload(network:string, stacksAddress:string):string {
	const net = getNet(network);
	return buildDepositPayloadInternal(net, 0, stacksAddress, false)
}

export function buildDepositPayloadOpDrop(network:string, revealFee:number, stacksAddress:string):string {
	const net = getNet(network);
	return buildDepositPayloadInternal(net, revealFee, stacksAddress, true)
}

function buildDepositPayloadInternal(net:any, amountSats:number, address:string, opDrop:boolean):string {
	const magicBuf = (typeof net === 'object' && (net.bech32 === 'tb' || net.bech32 === 'bcrt')) ? hex.decode(MAGIC_BYTES_TESTNET) : hex.decode(MAGIC_BYTES_MAINNET);
	const opCodeBuf = hex.decode(PEGIN_OPCODE);
	const addr = c32addressDecode(address.split('.')[0])
	//const addr0Buf = hex.encode(amountToUint8(addr[0], 1));
	const addr0Buf = (hex.decode(addr[0].toString(16)));
	const addr1Buf = hex.decode(addr[1]);

	const cnameLength = new Uint8Array(1);
	//const memoLength = new Uint8Array(1);
	const principalType = (address.indexOf('.') > -1) ? hex.decode('06') : hex.decode('05');
	let buf1 = concat(opCodeBuf, principalType, addr0Buf, addr1Buf);
	if (address.indexOf('.') > -1) {
		const cnameBuf = new TextEncoder().encode(address.split('.')[1]);
		const cnameBufHex = hex.encode(cnameBuf)
		let cnameLen:any;
		try {
			cnameLen = cnameLength.fill(cnameBufHex.length);
		} catch (err) {
			cnameLen = hex.decode(cnameBuf.length.toString(8))
		}
		buf1 = concat(buf1, cnameLen, cnameBuf);
	} else {
		cnameLength.fill(0);
		buf1 = concat(buf1, cnameLength);
	}
	/**
	if (memo) {
		const memoBuf = new TextEncoder().encode(memo);
		const memoLength = hex.decode(memoBuf.length.toString(8));
		buf1 = concat(buf1, memoLength, memoBuf);
	} else {
		memoLength.fill(0);
		buf1 = concat(buf1, memoLength);
	}
	 */
	if (opDrop) {
		const feeBuf = amountToBigUint64(amountSats, 8)
		buf1 = concat(buf1, feeBuf)
	}
	
	if (!opDrop) return hex.encode(concat(magicBuf, buf1))
	return hex.encode(buf1);
}

export function amountToBigUint64(amt, size) {
    //P..U64BE(BigInt(amt))
    const buffer = new ArrayBuffer(size);
    const view = new DataView(buffer);
    view.setBigUint64(0, BigInt(amt)); // Max unsigned 32-bit integer
    const res = new BigUint64Array(view.buffer);
    return hex.decode(bufferToHex(res.buffer));
    //(amt.toString(16).padStart(16, "0"))
}
function bufferToHex(buffer) {
    return [...new Uint8Array(buffer)]
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}
