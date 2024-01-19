import { getConfig } from "../../../lib/config.js";
import {Get, Route,Controller as Router } from "tsoa"
import { callContractReadOnly, fetchDataVar } from "../stacks/stacks_helper.js";
import { hex } from "@scure/base";
import { principalCV, serializeCV, contractPrincipalCV, cvToJSON, deserializeCV, uintCV } from '@stacks/transactions';
import { jobSaveDLCEvents } from "./dlc_helper.js";


function getData(contractId:string, functionName:string) {
  return {
    contractAddress: contractId!.split('.')[0],
    contractName: contractId!.split('.')[1],
    functionName,
    functionArgs: [],
    network: getConfig().network
  }
}

@Route("/uasu-api/{network}/v1/dlc")
export class DLCLinkController extends Router {
  
  @Get("/is-registered/:contractId")
  public async isRegistered(contractId:string): Promise<boolean> {
    try {
      const data = getData(getConfig().dlcManagerCid, 'is-contract-registered');
      //console.log('isRegistered: ', data)
      data.functionArgs = [`0x${hex.encode(serializeCV(contractPrincipalCV(contractId.split('.')[0], contractId.split('.')[1])))}`];
      const response = await callContractReadOnly(data);
      console.log('isRegistered:', response)
      const result = (response.value);
      return result;
    } catch(err:any) {
      console.log('isRegistered: ' + err.message)
      return false;
    }
  }


  @Get("/process-events/dlc-manager")
  public async jobReadCreateDLCEvents(): Promise<Array<any>> {
    try {
      return await jobSaveDLCEvents();
    } catch (err) {
      return []
    }
  }
  
  @Get("/attestor-id")
  public async getAttestorId(): Promise< { attestors: number }> {
    try {
      const contractId = getConfig().dlcManagerCid
      const attestorId = await fetchDataVar(contractId.split('.')[0], contractId.split('.')[1], 'attestor-id');
      const data = cvToJSON(deserializeCV(attestorId.data))
      return { attestors: Number(data.value) };
    } catch (err) {
      return { attestors: 0 }
    }
  }
  @Get("/protocol-wallet")
  public async getProtocolWallet(): Promise< { protocolWallet: string }> {
    try {
      const contractId = getConfig().dlcLenderCid;
      const result = await fetchDataVar(contractId.split('.')[0], contractId.split('.')[1], 'protocol-wallet-address');
      const data = cvToJSON(deserializeCV(result.data))
      return { protocolWallet: data.value };
    } catch (err) {
      return { protocolWallet: '?' }
    }
  }
  @Get("/attestor/:attestorId")
  public async getAttestor(attestorId:number): Promise<any> {
    try {
      const contractId = getConfig().dlcManagerCid
      const functionArgs = [`0x${hex.encode(serializeCV(uintCV(attestorId)))}`];
      const data = {
        contractAddress: contractId!.split('.')[0],
        contractName: contractId!.split('.')[1],
        functionName: 'get-registered-attestor',
        functionArgs,
        network: getConfig().network
      }
      const result = await callContractReadOnly(data);
 
      return { nonce: attestorId, domain: result.value.value.dns.value };
    } catch (err:any) {
      return { success: false, error: err.message }
    }
  }
}