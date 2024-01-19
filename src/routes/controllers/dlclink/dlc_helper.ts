import { saveNewDLCEvent } from '../../../lib/data/db_models.js';
import { getConfig } from '../../../lib/config.js';
import { deserializeCV, cvToJSON } from "@stacks/transactions";
import util from 'util'

const limit = 10;

export async function jobSaveDLCEvents() {
  try {
    let offset = 0; // await countContractEvents();
    const allEvents = [];
    let events:Array<any>;
    do {
      events = await saveDLCEvents(offset);
      offset += limit;
      allEvents.push(events)
    } while (events.length === limit);
    return allEvents;
  } catch (err:any) {
    console.log('err saveAllSbtcEvents: ' + err);
    return [];
  }
}

async function saveDLCEvents(offset:number):Promise<Array<any>> {
  try {
    const contractId = getConfig().dlcManagerCid;
    const url = getConfig().stacksApi + '/extended/v1/contract/' + contractId + '/events?limit=' + limit + '&offset=' + offset;
    const response = await fetch(url);
    const result:any = await response.json();
    return await indexEvents(result.results);
  } catch (err:any) {
    console.log('err - saveSbtcEvents2: ' + err);
    return [];
  }
}

async function indexEvents(sbtcEvents:Array<any>) {
  for (const event of sbtcEvents) {
    try {
      //console.log('event ', event);
      const edata:any = cvToJSON(deserializeCV(event.contract_log.value.hex));
      //console.log('edata ', edata);
      if (edata.value['callback-contract']) {
        let newEvent = {
          eventIndex: event.event_index,
          eventType: event.event_type,
          txId: event.tx_id,
          contractId: event.contract_log.contract_id,
          callbackContractId: edata.value['callback-contract'].value,
          creator: edata.value.creator.value,
          nonce: edata.value.nonce.value,
          uuid: edata.value.uuid.value.value,
          success: edata.value.uuid.success,
        };
        console.log('indexEvents: newEvent ', util.inspect(newEvent, false, null, true /* enable colors */));
        await saveNewDLCEvent(newEvent);
      }
    } catch (err:any) {
      console.log('indexEvents: Error: ', err); //util.inspect(err, false, null, true /* enable colors */));
    }
  }
  return sbtcEvents;
}
