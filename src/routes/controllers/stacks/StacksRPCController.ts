import { Get, Route } from "tsoa";
import { fetchDataVar, fetchNoArgsReadOnly, fetchUserBalances,  } from './stacks_helper.js';
import { AddressObject, KeySet, SbtcContractDataType } from "sbtc-bridge-lib";
import { getConfig } from "../../../lib/config.js";
import { FeeEstimateResponse, estimateSmartFee, getBlockCount } from "../bitcoin/rpc_wallet.js";
import { cvToJSON, deserializeCV } from '@stacks/transactions';
import { hex } from "@scure/base";
import { schnorr } from '@noble/curves/secp256k1';

export interface BalanceI {
  balance: number;
}

@Route("/uasu-api/:network/v1/stacks")
export class StacksController {

  @Get("/address/:stxAddress/:cardinal/:ordinal")
  public async fetchUserBalances(stxAddress:string, cardinal:string, ordinal:string): Promise<AddressObject> {
    return await fetchUserBalances(stxAddress, cardinal, ordinal);
  }
}

@Route("/uasu-api/:network/v1/sbtc")
export class SbtcWalletController {

  @Get("/fee-estimate")
  public async getFeeEstimate(): Promise<FeeEstimateResponse> {
    try {
      return await fetchCurrentFeeRates();
    } catch(err) {
      return await estimateSmartFee();
    }
  }
  
  @Get("/keys")
  public getKeys(): KeySet {
    return {
      deposits: {
        revealPubKey: hex.encode(schnorr.getPublicKey(getConfig().btcSchnorrReveal)),
        reclaimPubKey: hex.encode(schnorr.getPublicKey(getConfig().btcSchnorrReclaim)),
        oraclePubKey: hex.encode(schnorr.getPublicKey(getConfig().btcSchnorrOracle)),
      }
    }
  }
  
  @Get("/data")
  public async fetchSbtcContractData(): Promise<SbtcContractDataType> {
    let sbtcContractData:SbtcContractDataType = {} as SbtcContractDataType;
    try {
      sbtcContractData = await fetchNoArgsReadOnly();
    } catch (err:any) {
      sbtcContractData = {} as SbtcContractDataType;
      console.log(err.message)
    }
    try {
      const contractId = getConfig().sbtcContractId;
      const contractOwner = await fetchDataVar(contractId.split('.')[0], contractId.split('.')[1], 'contract-owner');
      const result = cvToJSON(deserializeCV(contractOwner.data));
      console.log(result)
      sbtcContractData.contractOwner = result.value
    } catch (err:any) {
      console.log(err.message)
    }
    try {
      const bc = await getBlockCount();
      sbtcContractData.burnHeight = bc.count;
    } catch (err:any) {
      console.log(err.message)
      sbtcContractData.burnHeight = -1;
    }
    //console.log('sbtcContractData: ', sbtcContractData)
    return sbtcContractData;
  }
}

async function fetchCurrentFeeRates() {
  try {
    const url = getConfig().blockCypherUrl;
    const response = await fetch(url!);
    const info = await response.json();
    return { feeInfo: { low_fee_per_kb:info.low_fee_per_kb, medium_fee_per_kb:info.medium_fee_per_kb, high_fee_per_kb:info.high_fee_per_kb }};
  } catch (err) {
    console.log(err);
    return { feeInfo: { low_fee_per_kb:20000, medium_fee_per_kb:30000, high_fee_per_kb:40000 }};
  }
}
