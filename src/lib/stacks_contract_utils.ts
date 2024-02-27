/**
 * sbtc - interact with Stacks Blockchain to read sbtc contract info
 */
import fetch from 'node-fetch';
import { type SbtcContractDataType, type AddressObject, type AddressMempoolObject, getPegWalletAddressFromPublicKey } from 'sbtc-bridge-lib';
import { cvToJSON, deserializeCV, principalCV, serializeCV } from '@stacks/transactions';
import { hex } from '@scure/base';
import { getConfig } from './config.js';
import { BalanceI } from '../types/sbtc_ui_types.js';

const limit = 10;

const noArgMethods = [
  'get-bitcoin-wallet-public-key',
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
      console.log('Error fetching sbtc alpha data from sbtc contract arg: ' + funcname)
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
        result.sbtcWalletAddress = getPegWalletAddressFromPublicKey(getConfig().network, fullPK)
        result.sbtcWalletPublicKey = fullPK
        // converting to x-only..
        //result.sbtcWalletPublicKey = fullPK;
        //try {
        //  const net = (getConfig().network === 'testnet') ? btc.TEST_NETWORK : btc.NETWORK;
        //  const trObj = btc.p2tr(fullPK.substring(1), undefined, net);
        //  if (trObj.type === 'tr') result.sbtcWalletAddress = trObj.address;
       //} catch (err:any) {
        //  console.log('get-bitcoin-wallet-public-key: getting key: ' + fullPK)
        //}
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

export async function fetchDataVar(contractAddress:string, contractName:string, dataVarName:string) {
  try {
    //checkAddressForNetwork(getConfig().network, contractAddress)
    const url = getConfig().stacksApi + '/v2/data_var/' + contractAddress + '/' + contractName + '/' + dataVarName;
    const response = await fetch(url);
    const result:any = await response.json();
    return result;
  } catch(err:any) {
    console.log('fetchDataVar: ' + err.message + ' contractAddress: ' + contractAddress);
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
    const functionArgs = [`0x${hex.encode(serializeCV(principalCV(stxAddress)))}`];
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

export async function fetchBalancesForUser(stxAddress:string, cardinal:string, ordinal:string):Promise<AddressObject> {
  const userBalances:AddressObject = {} as AddressObject;
  userBalances.stxAddress = stxAddress;
  userBalances.cardinal = cardinal;
  userBalances.ordinal = ordinal;
  try {
    //checkAddressForNetwork(getConfig().network, stxAddress)
    //checkAddressForNetwork(getConfig().network, cardinal)
    //checkAddressForNetwork(getConfig().network, ordinal)
    if (userBalances.stxAddress) {
      const url = getConfig().stacksApi + '/extended/v1/address/' + userBalances.stxAddress + '/balances';
      const response = await fetch(url);
      const result:any = await response.json();
      userBalances.stacksTokenInfo = result;
    }
  } catch(err:any) {
    //console.error('fetchUserBalances: stacksTokenInfo: ' + err.message)
  }
  try {
    if (userBalances.stxAddress) {
      const sBtcBalance = await fetchUserSbtcBalance(userBalances.stxAddress);
      userBalances.sBTCBalance = sBtcBalance.balance
    }
  } catch(err:any) {
    console.log('fetchUserBalances: sBtcBalance: ' + err.message)
  }
  try {
    //checkAddressForNetwork(getConfig().network, userBalances.cardinal)
    const address:AddressMempoolObject = await fetchAddress(userBalances.cardinal);
    userBalances.cardinalInfo = address
  } catch(err:any) {
    console.log('fetchUserBalances: cardinalInfo: ' + err.message)
  }
  try {
    //checkAddressForNetwork(getConfig().network, userBalances.cardinal)
    const address:AddressMempoolObject = await fetchAddress(userBalances.ordinal);
    userBalances.ordinalInfo = address
  } catch(err:any) {
    console.log('fetchUserBalances: ordinalInfo: ' + err.message)
  }
  return userBalances;
}

export async function fetchSbtcContractData(): Promise<SbtcContractDataType> {
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
  return sbtcContractData;
}


async function fetchAddress(address:string):Promise<AddressMempoolObject> {
  const url = getConfig().mempoolUrl + '/address/' + address;
  const response = await fetch(url);
  const result = await response.json();
  return result;
}


export async function callContractReadOnly(data:any) {
  const url = getConfig().stacksApi + '/v2/contracts/call-read/' + data.contractAddress + '/' + data.contractName + '/' + data.functionName
  let val;
  try {

    //console.log('callContractReadOnly: url: ', url)
    const hiroApi1 = 'ae4ecb7b39e8fbc0326091ddac461bc6'
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-hiro-api-key': hiroApi1
      },
      body: JSON.stringify({
        arguments: data.functionArgs,
        sender: data.contractAddress,
      })
    });
    val = await response.json();
  } catch (err) {
    console.error('callContractReadOnly4: ', err);
  }
  try {
    const result = cvToJSON(deserializeCV(val.result));
    return result;
  } catch (err:any) {
    console.error('Error: callContractReadOnly: ', val)
    return val
  } 
}
