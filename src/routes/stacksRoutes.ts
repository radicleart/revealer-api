import express from "express";
import { SbtcWalletController, StacksController } from "./controllers/stacks/StacksRPCController.js";
import { fetchStacksContract, fetchStacksInfo, fetchStacksTransaction } from "./controllers/stacks/stacks_helper.js";

const router = express.Router();

router.get("/address/balances/:stxAddress/:cardinal/:ordinal", async (req, res, next) => {
  try {
    //checkAddressForNetwork(getConfig().network, req.params.stxAddress)
    //checkAddressForNetwork(getConfig().network, req.params.cardinal)
    //checkAddressForNetwork(getConfig().network, req.params.ordinal)
    const controller = new StacksController();
    const response = await controller.fetchUserBalances(req.params.stxAddress, req.params.cardinal, req.params.ordinal);
    return res.send(response);
  } catch (error) {
    console.log('Error in routes: ', error)
    next('An error occurred fetching sbtc data.') 
  }
});

router.get("/data", async (req, res, next) => {
  try {
    const controller = new SbtcWalletController();
    const sbtcContractData = await controller.fetchSbtcContractData();
    return res.send(sbtcContractData);
  } catch (error) {
    console.log('Error in routes: ', error)
    next('An error occurred fetching sbtc data.')
  }
});

router.get("/tx/:txid", async (req, res, next) => {
  try {
    const tx = await fetchStacksTransaction(req.params.txid)
    return res.send(tx);
  } catch (error) {
    console.log('Error in routes: ', error)
    next('An error occurred fetching sbtc data.')
  }
});

router.get("/contract/:contractId", async (req, res, next) => {
  try {
    const tx = await fetchStacksContract(req.params.contractId)
    return res.send(tx);
  } catch (error) {
    console.log('Error in routes: ', error)
    next('An error occurred fetching sbtc data.')
  }
});

router.get("/v2/info", async (req, res, next) => {
  try {
    const tx = await fetchStacksInfo()
    return res.send(tx);
  } catch (error) {
    console.log('Error in routes: ', error)
    next('An error occurred fetching sbtc data.')
  }
});

router.get("/init-ui", async (req, res, next) => {
  try {
    const controller = new SbtcWalletController();
    const sbtcContractData = await controller.fetchSbtcContractData();
    //checkAddressForNetwork(getConfig().network, sbtcContractData.sbtcWalletAddress)
    const keys = await controller.getKeys();
    const btcFeeRates = await controller.getFeeEstimate();

    const response = {
      keys,
      sbtcContractData,
      btcFeeRates
    }
    return res.send(response);
  } catch (error) {
    console.log('Error in routes: ', error)
    next('An error occurred fetching sbtc data.')
  }
});

export { router as stacksRoutes } 
