import { CommitmentScriptDataType, VoutI } from "./sbtc_types";

export enum RevealerTxTypes {
	SBTC_DEPOSIT = 'SBTC_DEPOSIT',
	SBTC_WITHDRAWAL = 'SBTC_WITHDRAWAL',
}

export enum RevealerTxModes {
	OP_RETURN = 'OP_RETURN',
	OP_DROP = 'OP_DROP',
}

export enum CommitmentStatus {
	UNPAID = 0,
	PENDING = 1,
	PAID = 2,
	REVEALED = 3,
	RECLAIMED = 4,
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
	stacksApi: string; 
	stacksExplorerUrl: string;
	bitcoinExplorerUrl: string; 
	mempoolUrl: string; 
	blockCypherUrl: string;
	publicAppName: string;
	publicAppVersion: string; 
	sbtcContractId: string;
	electrumUrl: string;
};
    
export type CommitmentType = {
	commitmentRequest:CommitmentRequest;
    _id?: string;
	tries?: number;
    network: string;
	status: string;
    created: number;
    updated: number;
	paidFromAddress?: string|undefined;
    requestType: string;
    taprootScript: TaprootScriptType;
    vout0?: VoutI;
    vout?: VoutI;
	commitTxId?: string;
}

export type CommitmentResponse = {
	commitAddress: string;
	paymentPsbt: string|undefined;
	commitTxId?: string;
	recipientStxPrincipal?: string|undefined;
	inscriptionPayload?: string|undefined;
}

export type CommitmentError = {
	failed: boolean;
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

export type OpReturnRequest = {
	originator:string;
	recipient:string;
	signature?:string;
	amountSats:number;
	paymentPublicKey:string;
	paymentAddress:string;
	feeMultiplier:number;
}

export type OpDropRequest = {
	originator:string;
	recipient:string;
	amountSats:number;
	reclaimPublicKey:string;
	paymentAddress:string;
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

  export interface RevealerTransaction {
	_id?: string;
	txId: string;
	psbt?: string;
	originator: string;
	commitment?:CommitmentScriptDataType;
	vout?:VoutI;
	signed: boolean;
	recipient: string;
	amountSats: number;
	confirmations: number;
	created: number;
	updated: number;
	signature?: string;
	paymentPublicKey: string;
	paymentAddress: string;
	status: CommitmentStatus;
	mode: RevealerTxModes;
	type: RevealerTxTypes;
	blockHeight:number;
	sbtcPublicKey:string;
}

export type PSBTHolder = {
	hexPSBT:string;
	b64PSBT:string;
	txFee:number;
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
  
  