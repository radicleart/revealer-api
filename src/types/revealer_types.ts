import { VoutI } from "sbtc-bridge-lib";

export enum CommitmentStatus {
	UNPAID = 0,
	PAID = 1,
	REVEALED = 2,
	RECLAIMED = 3,
}

export enum CommitmentMode {
	OP_DROP = 'OP_DROP',
	OP_RETURN = 'OP_RETURN',
}

export enum RequestType {
	INSCRIPTION = 'INSCRIPTION',
	SBTC_DEPOSIT = 'SBTC_DEPOSIT',
	SBTC_WITHDRAWAL = 'SBTC_WITHDRAWAL',
}

export type ConfigI = {
	mongoDbUrl: string; 
	mongoUser: string; 
	mongoPwd: string; 
	mongoDbName: string; 
	btcNode: string; 
	btcRpcUser: string; 
	btcRpcPwd: string; 
	btcSchnorrReveal: string; 
	btcSchnorrReclaim: string; 
	btcSchnorrOracle: string; 
	host: string; 
	port: number; 
	walletPath: string; 
	network: string; 
	mode: string; 
	mempoolUrl: string; 
	electrumUrl: string; 
	blockCypherUrl: string; 
};
    
export type CommitmentType = {
	commitmentRequest:CommitmentRequest;
    _id?: string;
	tries?: number;
    network: string;
	status: number;
    created: number;
    updated: number;
    requestType: string;
    btcTxid?: string;
    taprootScript: TaprootScriptType;
    vout0?: VoutI;
    vout?: VoutI;
}

export type CommitmentResponse = {
	commitAddress: string;
	paymentPsbt: string|undefined;
}

export type CommitmentError = {
	code: string;
	message: string;
}

export type CommitmentRequest = {
	revealFee: number;
	revealerPublicKey: string;
	reclaimerPublicKey: string;
	payFromAddress: string|undefined;
	originator: string;
	recipientStxPrincipal?: string|undefined;
	inscriptionPayload?: string|undefined;
}


export type PubKeySet = {
	stxAddress: string;
	cardinal: string;
	ordinal: string;
	btcPubkeySegwit0?: string;
	btcPubkeySegwit1?: string;
  };
  
  export type SignerType = { publicKey: string, name: string }

  export interface SignRequestI {
	psbt: string;
	inputs: Array<number>;
  }

  export type TaprootScriptType = {
	address: string;
	script: string|Uint8Array|undefined;
	paymentType: string;
	redeemScript?: string|Uint8Array;
	witnessScript?: string|Uint8Array;
	wsh?:string;
	leaves?:any;
	tapInternalKey?:string|Uint8Array;
	tapLeafScript?:any;
	tapMerkleRoot?:string|Uint8Array;
	tweakedPubkey?:string|Uint8Array;
  }
  
  export type UTXO = {
	txid: string;
	vout: number;
	fullout?: {
	  scriptpubkey:string;
	  scriptpubkey_address:string;
	  scriptpubkey_asm:string;
	  scriptpubkey_type:string;
	  value:number;
	};
	tx: any;
	status: {
	  confirmed: boolean;
	  block_height?: number;
	  block_hash?: string;
	  block_time?: number;
	};
	value: number;
  };
  