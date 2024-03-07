import { Get, Route } from "tsoa";
import { getFeeEstimate, getKeys, getRates } from "../../lib/rates_utils.js";
import { AddressObject } from "sbtc-bridge-lib";
import { fetchBalancesForUser, fetchSbtcContractData, fetchUserSbtcBalance } from "../../lib/stacks_contract_utils.js";
import { BalanceI, UIObject } from "../../types/sbtc_ui_types.js";
import { fetchTransaction, getBlock } from "../../lib/bitcoin_utils.js";

export let cachedUIObject:UIObject;

@Route("/revealer-api/v1/sbtc")
export class SbtcWalletController {

  public async initUiCache(): Promise<any> {
    try {
      console.log('Adding [keys, sbtcContractData, btcFeeRates] data to cache')
      const sbtcContractData = await fetchSbtcContractData();
      const keys = await getKeys();
      const btcFeeRates = await getFeeEstimate();
      const rates = await getRates();

      cachedUIObject = {
        keys,
        sbtcContractData,
        btcFeeRates,
        rates
      }
    } catch (error) {
      console.log('Error in route initUiCache: ', error)
    }
    return cachedUIObject;
  }

/**
 * Fetch objects needed in the UI;
 * The object makes several contract calls and so is 
 * cached and refreshed every 3 minutes.
 * returns { 
 * 	keys:KeySet;
 *  sbtcContractData:SbtcContractDataType;
 *  btcFeeRates:FeeEstimateResponse;
 *  rates:Array<ExchangeRate>
 * }
 * @returns 
 */
@Get("/init-ui")
  public async initUi(): Promise<any> {
    if (!cachedUIObject) await this.initUiCache()
    return cachedUIObject;
  }

  @Get("/address/balances/:stxAddress/:cardinal/:ordinal")
  public async fetchUserBalances(stxAddress:string, cardinal:string, ordinal:string): Promise<AddressObject> {
    return await fetchBalancesForUser(stxAddress, cardinal, ordinal);
  }

  @Get("/bitcoin/:txid/:verbose")
  public async fetchBitcoinTransaction(txid:string, verbose:boolean): Promise<any> {
    return await fetchTransaction(txid, verbose);
  }

  @Get("/bitcoin/block/:blockhash/:verbosity")
  public async fetchBitcoinBlock(blockhash:string, verbosity:number): Promise<any> {
    return await getBlock(blockhash, verbosity);
  }

}
