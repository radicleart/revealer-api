import { CommitmentScriptDataType, VoutI } from "sbtc-bridge-lib";

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
	dlcLenderCid: string;
	dlcManagerCid: string;
	stacksApi: string; 
	stacksExplorerUrl: string;
	bitcoinExplorerUrl: string; 
	mempoolUrl: string; 
	blockCypherUrl: string;
	publicAppName: string;
	publicAppVersion: string; 
	sbtcContractId: string;
	mailChimpApiKey: string;
	mailChimpAudience: string;
  };
    
export type Loan = {
	uuid?: string;
  	loanId?: number;
	liquidityState?: { liquidatable: boolean|undefined, error?:number|string, loanId?:number, btcPrice:number };
	status: string;
	vaultLoan: number;
	liquidationRatio: number;
	liquidationFee: number;
	owner: string;
	attestorList?: Array<string>;
	btcTxId?: string;
	formattedVaultLoan?: string; 
	formattedLiquidationFee?: string; 
	formattedLiquidationRatio?: string;
	formattedVaultCollateral?:string;
	closingTXHash?: string;
	// seconds until an emergency refund transaction can be broadcasted. Set 0 to disable this feature.
	refundDelay?: number;
	// BTC address to send the BTC fees to (sends the fees to the protocol wallet if set to "0x")
	btcFeeRecipient?: string;
	// BTC fee basis points (1/100 of a percent) to send to the fee recipient (set 0 to disable this feature)
	btcFeeBasisPoints?: number;
	// amount of BTC to lock in the DLC in Satoshis
	vaultCollateral: number;
}

export type LockResponse = {
	stacksAddress?: string;
	uuid: string;
	contractId: string;
	txId: string;
}
  
export type CommitmentI = {
	_id?: string;
	status: number;
	tries?: number;
	updated?: number;
	amount: number;
	mode: string;
	requestType: string;
	wallet?: string;
	btcTxid?: string;
	fromBtcAddress: string;
	revealPub?: string;
	reclaimPub?: string;
	commitTxScript?: CommitmentScriptDataType;
	vout0?: VoutI;
	vout?: VoutI;
  };
  export type PubKeySet = {
	stxAddress: string;
	cardinal: string;
	ordinal: string;
	btcPubkeySegwit0?: string;
	btcPubkeySegwit1?: string;
  };
  
  export type SignerType = { publicKey: string, name: string }
  export interface ContractType {
	signerPublicKeys?:Array<SignerType>
	psbt?:string;
	outcome:number;
	newDrop:number;
	strikePrice:number;
	bob:number;
	alice: number;
	acceptTxId?: string;
	acceptTxError?: string;
	broadcast:boolean;
  }
export interface QuoteI {
	_id?:string;
	alicePubKeys?: PubKeySet;
	bobPubKeys: PubKeySet;
	commitment?:CommitmentI;
	originator: string;
	updated:number;
	type:string;
	product:string;
	expiration:number;
	expirationBH:number;
	priceAtTimeOfDeal:number;
	strikeDropPercentage:number;
	strikePriceUsd:number;
	maxInsurance: number;
	collateralBtc: number;
	premiumBtc:number;
	dlEscrowCall1: any;
	dlEscrowId: string;
	acceptPSBTHex?: string;
	acceptPSBTHexAlice?: string;
	acceptPSBTHexAliceDecoded?: any;
	acceptPSBTHexBob?: string;
	acceptPSBTHexBobDecoded?: any;
	acceptTxId?: string;
	acceptTxError?: string;
	contracts:Array<ContractType>;
}
	
export interface BalanceI {
	balance: number;
}

export enum CustomerStatus {
	subscribed = 'subscribed',
	unsubscribed = 'unsubscribed',
	cleaned = 'cleaned',
	pending = 'pending'
}
export interface CustomerI {
	email_address: string;
	status: string;
}
  
  export interface SignRequestI {
	psbt: string;
	inputs: Array<number>;
  }

  export interface Allowlist {
	_id?:string;
	address: string;
  }
