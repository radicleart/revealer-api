import express from "express";
import { OpReturnController } from "./OpReturnController.js";

const router = express.Router();
const controller = new OpReturnController()

router.get("/get-psbt-for-deposit/:recipient/:amountSats/:paymentPublicKey/:paymentAddress", async (req, res, next) => {
  try {
    const response = await controller.getPsbtForDeposit(req.params.recipient, Number(req.params.amountSats), req.params.paymentPublicKey, req.params.paymentAddress);
    if (response) {
      return res.send(response);
    }
    return res.status(404).send({failed: true, message: 'none here'}); //Send error response here
  } catch (error) {
    return res.status(500).send({failed: true, message: error.message})
  }
});

router.post("/broadcast-deposit", async (req, res, next) => {
  try {
    const tx = req.body;
    const result = await controller.sendRawTransaction(tx);
    console.log('/btc/tx/sendrawtx', result);
    return res.send(result);
  } catch (error) {
    console.log('Error in routes: ', error)
    next('An error occurred fetching sbtc data.') 
  }
});


router.get('*', function(req, res) {
  res.sendStatus(404);
});

export { router as opReturnRoutes }
