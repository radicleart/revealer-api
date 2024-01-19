import { getConfig } from '../../../lib/config.js';
import { hex } from "@scure/base";
import { principalCV, cvToValue, ListCV, bufferCV, uintCV, serializeCV, cvToJSON } from '@stacks/transactions';
import { StacksTestnet, StacksMainnet, StacksMocknet } from '@stacks/network';
import Decimal from 'decimal.js';
import { Loan } from '../../../types/loans.js';
import { callContractReadOnly } from '../stacks/stacks_helper.js';


export async function getCreatorLoans(stacksAddress:string, btcPrice:number) {
  try {
    const contractId = getConfig().dlcLenderCid;
    // const arg1 = `0x${hex.encode(serializeCV(principalCV(stacksAddress)))}`;
    //const functionArgs = [principalCV(stacksAddress)];
    const functionArgs = [`0x${hex.encode(serializeCV(principalCV(stacksAddress)))}`];
    const data = {
      contractAddress: contractId!.split('.')[0],
      contractName: contractId!.split('.')[1],
      functionName: 'get-creator-loans',
      functionArgs: functionArgs,
      network: getStacksNetwork(),
      senderAddress: stacksAddress
    }
    const response = await callContractReadOnly(data);
    const loans = []
    if (response.value) {
      for (const loan of response.value) {
        const l = formatClarityLoanContract(loan.value)
        l.loanId = Number(await getLoanId(l.uuid!))
        if (l.status === 'funded') {
          l.liquidityState = await checkLiquidation(l.loanId, btcPrice)
        }
        loans.push(l)
      }
    }
    return loans
  } catch (err) {
    console.log(err)
    return err.message;
  }
}

export async function getLoan(uuid:string, btcPrice:number):Promise<Loan|string> {
  try {
    const contractId = getConfig().dlcLenderCid;
    // const arg1 = `0x${hex.encode(serializeCV(principalCV(stacksAddress)))}`;
    //const functionArgs = [bufferCV(hex.decode(uuid.split('x')[1]))];
    const functionArgs = [`0x${hex.encode(serializeCV(bufferCV(hex.decode(uuid.split('x')[1]))))}`];
    const data = {
      contractAddress: contractId!.split('.')[0],
      contractName: contractId!.split('.')[1],
      functionName: 'get-loan-id-by-uuid',
      functionArgs,
      network: getStacksNetwork(),
      senderAddress: undefined
    }
    const response = await callContractReadOnly(data);
    console.log(response)
    const loan = formatClarityLoanContract((response));
    loan.loanId = await getLoanId(loan.uuid!)
    if (loan.status === 'funded') {
      loan.liquidityState = await checkLiquidation(loan.loanId, btcPrice)
    }
  return loan
  } catch (err) {
    console.log(err)
    return err.message;
  }
}

export async function checkLiquidation(loanId:number, btcPrice: number):Promise<any> {
  try {
    const contractId = getConfig().dlcLenderCid;
    const functionArgs = [`0x${hex.encode(serializeCV(uintCV(loanId)))}`, `0x${hex.encode(serializeCV(uintCV(btcPrice)))}`];
    // const arg1 = `0x${hex.encode(serializeCV(principalCV(stacksAddress)))}`;
    const data = {
      contractAddress: contractId!.split('.')[0],
      contractName: contractId!.split('.')[1],
      functionName: 'check-liquidation',
      functionArgs: functionArgs,
      network: getStacksNetwork(),
      senderAddress: undefined
    }
    const response = await callContractReadOnly(data);
    if (response.success) {
      return { liquidatable: response.value.value, loanId, btcPrice }
    } else {
      return { liquidatable: undefined, error: response.value.value, loanId, btcPrice }
    }
  } catch (err) {
    console.log(err)
    return { liquidatable: false, error: err.message };
  }
}

export async function getLoanId (uuid:string) {
  const contractId = getConfig().dlcLenderCid;
  const functionArgs = [`0x${hex.encode(serializeCV(bufferCV(hex.decode(uuid.split('x')[1]))))}`];

  const data = {
    contractAddress: contractId!.split('.')[0],
    contractName: contractId!.split('.')[1],
    functionName: 'get-loan-id-by-uuid',
    functionArgs: functionArgs,
    network: getStacksNetwork(),
    senderAddress: contractId!.split('.')[0]
  }
  const response = await callContractReadOnly(data);
	return Number(response.value.value);
}

function getStacksNetwork() {
	const network = getConfig().network;
	let stxNetwork:StacksMainnet|StacksTestnet;
	if (network === 'devnet') stxNetwork = new StacksMocknet();
	else if (network === 'testnet') stxNetwork = new StacksTestnet();
	else if (network === 'mainnet') stxNetwork = new StacksMainnet();
	else stxNetwork = new StacksMocknet();
  stxNetwork = new StacksMocknet();
	return stxNetwork;
}

function formatClarityLoanContract(loan):Loan {
  const loanContract = loan.value;
  const uuid = loanContract.dlc_uuid.value.value;
  const status = loanContract.status.value;
  const owner = loanContract.owner.value;
  const vaultCollateral = customShiftValue(parseInt(loanContract['vault-collateral'].value), 8, true);
  const formattedVaultCollateral = `${vaultCollateral} BTC`;
  const vaultLoan = Number(customShiftValue(parseInt(loanContract['vault-loan'].value), 8, true));
  const formattedVaultLoan = `${vaultLoan} sBTC`;
  const liquidationFee = parseInt(loanContract['liquidation-fee'].value);
  const formattedLiquidationFee = `${liquidationFee} %`;
  const liquidationRatio = parseInt(loanContract['liquidation-ratio'].value);
  const formattedLiquidationRatio = `${liquidationRatio} %`;
  const attestorList = loanContract.attestors.value.map((attestor) => attestor.value.dns.value);
  const closingTXHash = loanContract['btc-tx-id']?.value?.value;
  return {
    uuid,
    status,
    owner,
    vaultCollateral,
    formattedVaultCollateral,
    vaultLoan,
    formattedVaultLoan,
    liquidationFee,
    formattedLiquidationFee,
    liquidationRatio,
    formattedLiquidationRatio,
    closingTXHash,
    attestorList,
  };
}

function customShiftValue(value, shift, unshift) {
  const decimalPoweredShift = new Decimal(10 ** shift);
  const decimalValue = new Decimal(Number(value));
  const decimalShiftedValue = unshift
    ? decimalValue.div(decimalPoweredShift).toNumber()
    : decimalValue.mul(decimalPoweredShift).toNumber();

  return decimalShiftedValue;
}