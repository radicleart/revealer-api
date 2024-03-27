import express from "express";
import { PayloadController } from "./PayloadController.js";

const router = express.Router();

router.get("/build/deposit/:stxAddress", async (req, res, next) => {
  try {
    const controller = new PayloadController();
    const response = await controller.commitDepositData(req.params.stxAddress);
    return res.send(response);
  } catch (error) {
    console.log('Error in routes: ', error)
    next('An error occurred fetching sbtc data.') 
  }
});

router.get("/build/deposit/op_drop/:stxAddress/:revealFee", async (req, res, next) => {
  try {
    const controller = new PayloadController();
    const response = await controller.commitDepositDataOpDrop(req.params.stxAddress, Number(req.params.revealFee));
    return res.send(response);
  } catch (error) {
    console.log('Error in routes: ', error)
    next('An error occurred fetching sbtc data.') 
  }
});

router.get("/parse/deposit/:data", async (req, res, next) => {
  try {
    const controller = new PayloadController();
    const response = await controller.commitDeposit(req.params.data);
    return res.send(response);
  } catch (error) {
    console.log('Error in routes: ', error)
    next('An error occurred fetching sbtc data.')
  }
});

router.get("/build/withdrawal/:signature/:amount", async (req, res, next) => {
  try {
    const controller = new PayloadController();
    const response = await controller.commitWithdrawalData(req.params.signature, Number(req.params.amount));
    return res.send(response);
  } catch (error) {
    console.log('Error in routes: ', error)
    next('An error occurred fetching sbtc data.')
  }
});

router.get("/build/withdrawal/op_drop/:signature/:amount", async (req, res, next) => {
  try {
    const controller = new PayloadController();
    const response = await controller.commitWithdrawalDataOpDrop(req.params.signature, Number(req.params.amount));
    return res.send(response);
  } catch (error) {
    console.log('Error in routes: ', error)
    next('An error occurred fetching sbtc data.')
  }
});

router.get("/parse/tx/:txid", async (req, res, next) => {
  try {
    const controller = new PayloadController();
    const response = await controller.parseTransaction(req.params.txid);
    return res.send(response);
  } catch (error) {
    console.log('Error in routes: ', error)
    next('An error occurred fetching sbtc data.') 
  }
});

router.get("/parse/:data/:bitcoinAddress", async (req, res, next) => {
  try {
    const controller = new PayloadController();
    const response = await controller.parsePayload(req.params.data, req.params.bitcoinAddress);
    return res.send(response);
  } catch (error) {
    console.log('Error in routes: ', error)
    next('An error occurred fetching sbtc data.') 
  }
});

router.get("/parse/withdrawal/:data/:bitcoinAddress", async (req, res, next) => {
  try {
    const controller = new PayloadController();
    const response = await controller.parsePayloadWithdrawal(req.params.data, req.params.bitcoinAddress);
    return res.send(response);
  } catch (error) {
    console.log('Error in routes: ', error)
    next('An error occurred fetching sbtc data.') 
  }
});

router.get('*', function(req, res) {
  res.sendStatus(404);
});

export { router as payloadRoutes }
