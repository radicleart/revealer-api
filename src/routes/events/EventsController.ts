import { Get, Route } from "tsoa";
import {
  countSbtcEvents,
  findSbtcEvents,
  findSbtcEventsByFilter,
  saveAllSbtcEvents,
  saveSbtcEventsByStacksTx,
  saveSbtcEventsByPage,
} from "./events_helper.js";
import { findContractEventsByPage } from "./events_db.js";
import { sbtcContractEvents } from "../../lib/data/mongodb_connection.js";
import { ObjectId } from "mongodb";
import { SbtcClarityEvent } from "../../types/sbtc_types.js";

export interface BalanceI {
  balance: number;
}

@Route("/revealer-api/:network/v1/events")
export class EventsController {
  @Get("/save-all")
  public async saveAll(): Promise<any> {
    return await saveAllSbtcEvents();
  }

  @Get("/save-by-stacks-tx/:txid")
  public async saveByStacksTx(txid: string): Promise<any> {
    return await saveSbtcEventsByStacksTx(txid);
  }

  @Get("/save-by-page/:page")
  public async saveByPage(page: number): Promise<Array<SbtcClarityEvent>> {
    return await saveSbtcEventsByPage(page);
  }

  @Get("/find-by/filter/:name/:value")
  public async findSbtcEventsByFilter(
    name: string,
    value: string
  ): Promise<Array<SbtcClarityEvent>> {
    return await findSbtcEventsByFilter({ name: value });
  }

  @Get("/find-all")
  public async findAllSbtcEvents(): Promise<{
    results: Array<SbtcClarityEvent>;
    events: number;
  }> {
    const results = await findSbtcEvents();
    const events = await countSbtcEvents();
    return { results, events };
  }

  @Get("/find-by/page/:page/:limit")
  public async findSbtcEventsByPage(
    page: number,
    limit: number
  ): Promise<{ results: Array<SbtcClarityEvent>; events: number }> {
    const results = await findContractEventsByPage({}, page, limit);
    const events = await countSbtcEvents();
    return { results, events };
  }

  @Get("/find-by/filter-and-page/:filter/:page/:limit")
  public async findSbtcEventsByFilterAndPage(
    filter: any,
    page: number,
    limit: number
  ): Promise<{ results: Array<SbtcClarityEvent>; events: number }> {
    const results = await findContractEventsByPage(filter, page, limit);
    const events = await countSbtcEvents();
    return { results, events };
  }

  @Get("/count")
  public async countSbtcEvents(): Promise<{ events: number }> {
    return { events: await countSbtcEvents() };
  }

  @Get("/find-by/sbtc-wallet/:sbtcWallet")
  public async findContractEventBySbtcWalletAddress(
    sbtcWallet: string
  ): Promise<any> {
    const result = await sbtcContractEvents
      .find({ "payloadData.sbtcWallet": sbtcWallet })
      .sort({ "payloadData.burnBlockHeight": -1, "payloadData.txIndex": -1 })
      .toArray();
    return result;
  }

  @Get("/find-by/stacks/:stacksAddress")
  public async findContractEventByStacksAddress(
    stacksAddress: string
  ): Promise<any> {
    const result = await sbtcContractEvents
      .find({ "payloadData.stacksAddress": stacksAddress })
      .sort({ "payloadData.burnBlockHeight": -1, "payloadData.txIndex": -1 })
      .toArray();
    return result;
  }

  @Get("/find-by/bitcoin/:bitcoinAddress")
  public async findContractEventByBitcoinAddress(
    bitcoinAddress: string
  ): Promise<any> {
    const result = await sbtcContractEvents
      .find({ "payloadData.spendingAddress": bitcoinAddress })
      .sort({ "payloadData.burnBlockHeight": -1, "payloadData.txIndex": -1 })
      .toArray();
    return result;
  }

  @Get("/find-by/bitcoin-txid/:bitcoinTxid")
  public async findContractEventByBitcoinTxId(
    bitcoinTxid: string
  ): Promise<any> {
    const result = await sbtcContractEvents
      .find({ "bitcoinTxid.payload.value": "0x" + bitcoinTxid })
      .sort({ "payloadData.burnBlockHeight": -1, "payloadData.txIndex": -1 })
      .toArray();
    return result;
  }

  @Get("/find-one/:id")
  public async findContractEventById(id: string): Promise<any> {
    let o_id = new ObjectId(id);
    const result = await sbtcContractEvents.findOne({ _id: o_id });
    return result;
  }
}
