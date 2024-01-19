import express from "express";
import { DLCLinkController } from "./controllers/dlclink/DLCLinkController.js";

/**
 * Routes relating to generic DLC functions
 */

const router = express.Router();

router.get("/is-registered/:contractId", async (req, res, next) => {
  try {
    const controller = new DLCLinkController();
    const response = await controller.isRegistered(req.params.contractId);
    return res.send(response);
  } catch (error) {
    console.log('Error in routes: ', error)
    next('An error occurred fetching sbtc data.') 
  }
});

router.get("/attestor-id", async (req, res, next) => {
  try {

    const controller = new DLCLinkController();
    const response = await controller.getAttestorId();
    return res.send(response);
  } catch (error) {
    console.log('Error in routes: ', error)
    next('An error occurred fetching sbtc data.') 
  }
});

router.get("/protocol-wallet", async (req, res, next) => {
  try {

    const controller = new DLCLinkController();
    const response = await controller.getProtocolWallet();
    return res.send(response);
  } catch (error) {
    console.log('Error in routes: ', error)
    next('An error occurred fetching sbtc data.') 
  }
});

router.get("/attestor/:attestorId", async (req, res, next) => {
  try {
    const controller = new DLCLinkController();
    const response = await controller.getAttestor(Number(req.params.attestorId));
    return res.send(response);
  } catch (error) {
    console.log('Error in routes: ', error)
    next('An error occurred fetching sbtc data.') 
  }
});

router.get("/process-events/dlc-manager", async (req, res, next) => {
  try {
    const controller = new DLCLinkController();
    const response = await controller.jobReadCreateDLCEvents();
    return res.send(response);
  } catch (error) {
    console.log('Error in routes: ', error)
    next('An error occurred fetching sbtc data.') 
  }
});

export { router as dlcLinkRoutes }
