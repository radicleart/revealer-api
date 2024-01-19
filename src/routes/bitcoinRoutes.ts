import express from "express";
import { BlocksController, WalletController } from "./controllers/bitcoin/BitcoinController.js";
import { combinepsbt, decodePSBT, getBlockCount } from "./controllers/bitcoin/rpc_wallet.js";
import { SignRequestI } from "../types/loans.js";

const router = express.Router();

router.get("/blocks/count", async (req, res, next) => {
  try {
    const response = await getBlockCount();
    return res.send(response);
  } catch (error) {
    console.log('Error in routes: ', error)
    next('An error occurred fetching sbtc data.')
  }
});

router.post("/tx/sendrawtx", async (req, res, next) => {
  try {
    console.log('/tx/sendrawtx', req.body);
    const tx = req.body;
    const controller = new BlocksController();
    const result = await controller.sendRawTransaction(tx.hex, tx.maxFeeRate || 0);
    console.log('/tx/sendrawtx', result);
    return res.send(result);
  } catch (error) {
    console.log('Error in routes: ', error)
    next('An error occurred fetching sbtc data.') 
  }
});

router.post("/sign-inputs", async (req, res, next) => {
  try {
    const partial:SignRequestI = req.body;
    const controller = new WalletController();
    const response = await controller.signInputs(partial);
    return res.send(response);
  } catch (error) {
    console.log('sign-inputs error: ', error)
    next('An error occurred fetching sbtc data.')
  }
});

router.get("/gettxout/:txid/:vout", async (req, res, next) => {
  try {
    const controller = new WalletController();
    const response = await controller.getUnspentOutput(req.params.txid, Number(req.params.vout));
    return res.send(response);
  } catch (error) {
    console.log('Error in routes: ', error)
    next('An error occurred fetching sbtc data.') 
  }
});

router.post("/combinepsbt", async (req, res, next) => {
  try {
    const psbts:string = req.body;
    const c = await combinepsbt(psbts);
    return res.send(c);
  } catch (error) {
    next('An error occurred saving new quote.')
  }
});

router.post("/decodepsbt", async (req, res, next) => {
  try {
    const psbt:string = req.body;
    const c = await decodePSBT(psbt);
    console.log("/uasu-api/:network/v1/decodepsbt", c)
    return res.send(c);
  } catch (error) {
    next('An error occurred saving new quote.')
  }
});

router.get('*', function(req, res) {
  res.sendStatus(404);
});

export { router as bitcoinRoutes } 
