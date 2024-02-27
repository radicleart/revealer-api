import { getConfig } from '../../lib/config.js';

export interface IStringToStringDictionary { [key: string]: string|number|undefined; }
export class ConfigController {
  public getAllParam(): any {
    const config = getConfig();
    return {
      network: config.network,
      electrumUrl: config.electrumUrl,
      blockCypherUrl: config.blockCypherUrl,
    };
  }
}