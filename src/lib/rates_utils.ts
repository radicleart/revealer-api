import { hex, base64 } from '@scure/base';
import { schnorr } from '@noble/curves/secp256k1';
import { exchangeRatesCollection } from './data/mongodb_connection.js';
import { ExchangeRate, KeySet } from 'sbtc-bridge-lib';
import { getConfig } from './config.js';
import { currencies } from './utils_currencies.js';
import { BASE_URL, OPTIONS, handleError } from './bitcoin_utils.js';
import { FeeEstimateResponse } from '../types/sbtc_ui_types.js';

export function getKeys(): KeySet {
    return {
        deposits: {
            revealPubKey: (process.env.btcSchnorrReveal) ? hex.encode(schnorr.getPublicKey(process.env.btcSchnorrReveal)) : '',
            reclaimPubKey: (process.env.btcSchnorrReclaim) ? hex.encode(schnorr.getPublicKey(process.env.btcSchnorrReclaim)) : '',
            oraclePubKey: '' 
        }
    }
}

export async function getFeeEstimate(): Promise<FeeEstimateResponse> {
  try {
    return fetchCurrentFeeRates();
  } catch(err) {
    return estimateSmartFee();
  }
}

export async function getRates():Promise<any> {
    const rates = await getExchangeRates();
    return rates;
}

export async function updateExchangeRates() {
    try {
      const url = 'https://blockchain.info/ticker';
      const response = await fetch(url);
      const info = await response.json();
      for (var key in info) {
        const dbRate:ExchangeRate = await findExchangeRateByCurrency(key)
        if (!dbRate) {
          const newRate = {
            currency: key,
            fifteen: info[key]['15m'],
            last: info[key].last,
            buy: info[key].buy,
            sell: info[key].sell,
            symbol: currencies[key].symbol,
            name: currencies[key].name
          }
          saveNewExchangeRate(newRate)
        } else {
          updateExchangeRate(dbRate, {
            currency: key,
            fifteen: info[key]['15m'],
            last: info[key].last,
            buy: info[key].buy,
            sell: info[key].sell,
            symbol: currencies[key].symbol,
            name: currencies[key].name
          })
        }
      }
      return getExchangeRates();
    } catch (err) {
      console.log(err);
    }
  }
  
  async function fetchCurrentFeeRates() {
    try {
      if (getConfig().network === 'devnet') {
        const url = getConfig().mempoolUrl + '/v1/mining/blocks/fee-rates/1m';
        const response = await fetch(url);
        const info = await response.json();
        return { feeInfo: { low_fee_per_kb:info[0].avgFee_100, medium_fee_per_kb:info[1].avgFee_100, high_fee_per_kb:info[2].avgFee_100 }};
      } else {
        const url = getConfig().blockCypherUrl;
        const response = await fetch(url);
        const info = await response.json();
        return { feeInfo: { low_fee_per_kb:info.low_fee_per_kb, medium_fee_per_kb:info.medium_fee_per_kb, high_fee_per_kb:info.high_fee_per_kb }};
      }
    } catch (err:any) {
      console.log('fetchCurrentFeeRates: ' + err.message);
      return { feeInfo: { low_fee_per_kb:2000, medium_fee_per_kb:3000, high_fee_per_kb:4000 }};
    }
  }

  async function estimateSmartFee(): Promise<FeeEstimateResponse> {
    const dataString = `{"jsonrpc":"1.0","id":"curltext","method":"estimatesmartfee","params":[6]}`;
    OPTIONS.body = dataString;
    const response = await fetch(BASE_URL, OPTIONS);
    await handleError(response, 'Fee info not found');
    const result = await response.json();
    const feeRate = result.result.feerate * 100000000; // to go to sats
    return {
      feeInfo: {
        low_fee_per_kb: feeRate / 2,
        medium_fee_per_kb: feeRate,
        high_fee_per_kb: feeRate * 2
      }
    };
  }
  
  
/** Exchnage rate mongo db helper functions */
export async function delExchangeRates () {
	await exchangeRatesCollection.deleteMany();
	return;
}
export async function setExchangeRates (ratesObj:any) {
	return await exchangeRatesCollection.insertMany(ratesObj);
}
export async function getExchangeRates () {
	const result = await exchangeRatesCollection.find({}).sort({'currency': -1}).toArray();
	return result;
}
export async function findExchangeRateByCurrency(currency:string):Promise<any> {
	const result = await exchangeRatesCollection.findOne({currency});
	return result;
}
export async function saveNewExchangeRate (exchangeRate:any) {
	const result = await exchangeRatesCollection.insertOne(exchangeRate);
	return result;
}
export async function updateExchangeRate (exchangeRate:any, changes: any) {
	const result = await exchangeRatesCollection.updateOne({
		_id: exchangeRate._id
	}, 
    { $set: changes});
	return result;
}
