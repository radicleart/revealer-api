/**
 * sbtc - interact with Stacks Blockchain to read sbtc contract info
 */
import { deserializeCV, cvToJSON, serializeCV } from "micro-stacks/clarity";
import { principalCV } from 'micro-stacks/clarity';
import { bytesToHex } from "micro-stacks/common";
import { getConfig } from '../../../lib/config.js';
import { fetchAddress } from '../bitcoin/MempoolApi.js';
import fetch from 'node-fetch';
import type { BalanceI } from './StacksRPCController.js';
import type { PayloadType, SbtcContractDataType, AddressObject, AddressMempoolObject } from 'sbtc-bridge-lib';
import * as btc from '@scure/btc-signer';
import { c32address, c32addressDecode } from 'c32check';

export function decodeStacksAddress(stxAddress:string) {
	if (!stxAddress) throw new Error('Needs a stacks address');
	const decoded = c32addressDecode(stxAddress)
	return decoded
}
  
export function encodeStacksAddress (network:string, b160Address:string) {
	let version = 26
	if (network === 'mainnet') version = 22
	const address = c32address(version, b160Address) // 22 for mainnet
	return address
}

const noArgMethods = [
  'get-bitcoin-wallet-public-key',
  'get-supply',
  'get-token-uri',
  'get-total-supply',
  'get-decimals',
  'get-name',
]

export async function fetchNoArgsReadOnly():Promise<SbtcContractDataType> {
  const result = {} as SbtcContractDataType
  const contractId = getConfig().sbtcContractId;
  //checkAddressForNetwork(getConfig().network, contractId)
  const data = {
    contractAddress: contractId!.split('.')[0],
    contractName: contractId!.split('.')[1],
    functionName: '',
    functionArgs: [],
    network: getConfig().network
  }
  for (let arg in noArgMethods) {
    let funcname = noArgMethods[arg]
    let  response;
    try {
      data.functionName = funcname;
      response = await callContractReadOnly(data);
      resolveArg(result, response, funcname)
    } catch (err:any) {
      console.log('Error fetching sbtc alpha data from sbtc contrcat')
      //throw new Error('Error fetching sbtc alpha data from sbtc contrcat: ' + err.message)
    }
  }
  result.contractId = contractId;
  return result;
}

function resolveArg(result:SbtcContractDataType, response:any, arg:string) {
  let current = response
  if (response.value && response.value.value) {
    current = response.value.value
  }
  switch (arg) {
    case 'get-bitcoin-wallet-public-key':
      //console.log('get-bitcoin-wallet-public-key: response: ', response)
      try {
        const fullPK = response.value.value.split('x')[1];
        // converting to x-only..
        result.sbtcWalletPublicKey = fullPK;
        try {
          const net = (getConfig().network === 'testnet') ? btc.TEST_NETWORK : btc.NETWORK;
          const trObj = btc.p2tr(fullPK.substring(1), undefined, net);
          if (trObj.type === 'tr') result.sbtcWalletAddress = trObj.address;
        } catch (err:any) {
          console.log('get-bitcoin-wallet-public-key: getting key: ' + fullPK)
        }
      } catch(err) {
        console.log('get-bitcoin-wallet-public-key: current: ', current)
        console.log('get-bitcoin-wallet-public-key: err: ', err)
      }
      break;
    case 'get-num-keys':
      result.numKeys = current.value;
      break;
    case 'get-num-signers':
      result.numParties = current.value;
      break;
    case 'get-threshold':
      result.threshold = Number(current.value);
      break;
    case 'get-trading-halted':
      result.tradingHalted = current.value;
      break;
    case 'get-token-uri':
      result.tokenUri = current.value;
      break;
    case 'get-total-supply':
      result.totalSupply = Number(current);
      break;
    case 'get-decimals':
      result.decimals = Number(current);
      break;
    case 'get-name':
      result.name = current;
      break;
    default:
      break;
  }
}

export async function fetchStacksInfo() {
  try {
    const url = getStacksPathForV2Calls() + '/v2/info';
    const response = await fetch(url);
    const result:any = await response.json();
    return result;
  } catch(err:any) {
    console.log('fetchStacksTransaction: ' + err.message);
  }
}

export async function fetchStacksTransaction(txid:string) {
  try {
    const url = getConfig().stacksApi + '/extended/v1/tx/' + txid;
    const response = await fetch(url);
    const result:any = await response.json();
    return result;
  } catch(err:any) {
    console.log('fetchStacksTransaction: ' + err.message + ' txid: ' + txid);
  }
}

export async function fetchStacksContract(contractId:string) {
  try {
    const url = getConfig().stacksApi + '/extended/v1/contract/' + contractId + '?proof=0';
    const response = await fetch(url);
    const result:any = await response.json();
    return result;
  } catch(err:any) {
    console.log('fetchStacksTransaction: ' + err.message + ' contractId: ' + contractId);
  }
}

export async function fetchDataVar(contractAddress:string, contractName:string, dataVarName:string) {
  try {
    //checkAddressForNetwork(getConfig().network, contractAddress)
    const url = getStacksPathForV2Calls() + '/v2/data_var/' + contractAddress + '/' + contractName + '/' + dataVarName;
    const response = await fetch(url);
    const result:any = await response.json();
    return result;
  } catch(err:any) {
    console.log('fetchUserBalances: stacksTokenInfo: ' + err.message + ' contractAddress: ' + contractAddress);
  }
}

export async function fetchSbtcWalletAddress() {
  try {
    const contractId = getConfig().sbtcContractId;
    const data = {
      contractAddress: contractId!.split('.')[0],
      contractName: contractId!.split('.')[1],
      functionName: 'get-bitcoin-wallet-public-key',
      functionArgs: [],
      network: getConfig().network
    }
    const result = await callContractReadOnly(data);
    if (result.value && result.value.value) {
      return result.value.value
    }
    if (result.type.indexOf('some') > -1) return result.value
    if (getConfig().network === 'testnet') {
      return 'tb1q....'; // alice
    }
  } catch (err) {
    return 'tb1qa....';
  }
}

export async function fetchUserSbtcBalance(stxAddress:string):Promise<BalanceI> {
  try {
    const contractId = getConfig().sbtcContractId;
    //const functionArgs = [`0x${bytesToHex(serializeCV(uintCV(1)))}`, `0x${bytesToHex(serializeCV(standardPrincipalCV(address)))}`];
    const functionArgs = [`0x${bytesToHex(serializeCV(principalCV(stxAddress)))}`];
    const data = {
      contractAddress: contractId!.split('.')[0],
      contractName: contractId!.split('.')[1],
      functionName: 'get-balance',
      functionArgs,
      network: getConfig().network
    }
    const result = await callContractReadOnly(data);
    if (result.value && result.value.value) {
      return { balance: Number(result.value.value) };
    }
    return { balance: 0 };
  } catch (err) {
    return { balance: 0 };
  }
}

export async function fetchUserBalances(stxAddress:string, cardinal:string, ordinal:string):Promise<AddressObject> {
  const userBalances:AddressObject = {} as AddressObject;
  userBalances.stxAddress = stxAddress;
  userBalances.cardinal = cardinal;
  userBalances.ordinal = ordinal;
  try {
    const url = getConfig().stacksApi + '/extended/v1/address/' + userBalances.stxAddress + '/balances';
    const response = await fetch(url);
    const result:any = await response.json();
    userBalances.stacksTokenInfo = result;
  } catch(err) {
    console.log('fetchUserBalances: stacksTokenInfo: ', err)
  }
  try {
    if (userBalances.cardinal && userBalances.cardinal !== 'undefined') {
      const address:AddressMempoolObject = await fetchAddress(userBalances.cardinal);
      userBalances.cardinalInfo = address
    }
  } catch(err) {
    console.log('fetchUserBalances: cardinalInfo: ', err)
  }
  try {
    if (userBalances.ordinal && userBalances.ordinal !== 'undefined') {
      const address:AddressMempoolObject = await fetchAddress(userBalances.ordinal);
      userBalances.ordinalInfo = address
    }
  } catch(err) {
    console.log('fetchUserBalances: ordinalInfo: ', err)
  }
  return userBalances;
}

export function getStacksPathForV2Calls() {
  let stacksUrl = getConfig().stacksApi
  if (stacksUrl.indexOf('3999') > -1) {
    stacksUrl = stacksUrl.replace('3999', '20443') 
  }
  return stacksUrl
}

export async function callContractReadOnly(data:any) {
  const url = getStacksPathForV2Calls() + '/v2/contracts/call-read/' + data.contractAddress + '/' + data.contractName + '/' + data.functionName
  console.log('callContractReadOnly: ', url)
  let val;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        arguments: data.functionArgs,
        sender: data.contractAddress,
      })
    });
    val = await response.json();
    const result = cvToJSON(deserializeCV(val.result));
    return result;
  } catch (err) {
    console.log('callContractReadOnly4: ', err);
    return val;
  }
}
