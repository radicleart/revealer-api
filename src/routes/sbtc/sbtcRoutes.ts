import express from "express";
import { SbtcWalletController } from "./SbtcWalletController.js";

const router = express.Router();
const controller = new SbtcWalletController();

router.get("/init-ui", async (req, res, next) => {
  return res.send(await controller.initUi());
});

router.get("/address/balances/:stxAddress/:cardinal/:ordinal", async (req, res, next) => {
  try {
    console.log('/address/balances/:stxAddress/:cardinal/:ordinal')
    const response = await controller.fetchUserBalances(req.params.stxAddress, req.params.cardinal, req.params.ordinal);
    return res.send(response);
  } catch (error) {
    console.log('Error in routes: ', error)
    next('An error occurred fetching sbtc data.') 
  }
});


export { router as sbtcRoutes }
