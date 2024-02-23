import express from "express";
import { OpReturnController } from "./OpReturnController.js";

const router = express.Router();
const controller = new OpReturnController()

router.get("/get-psbt-for-deposit/:recipient/:amountSats/:paymentPublicKey/:paymentAddress/:feeMultiplier", async (req, res, next) => {
  try {
    const response = await controller.getPsbtForDeposit(req.params.recipient, Number(req.params.amountSats), req.params.paymentPublicKey, req.params.paymentAddress, Number(req.params.feeMultiplier));
    if (response) {
      return res.send(response);
    }
    return res.status(404).send({failed: true, message: 'none here'}); //Send error response here
  } catch (error) {
    return res.status(500).send({failed: true, message: error.message})
  }
});

router.get("/get-psbt-for-withdrawal/:withdrawalAddress/:signature/:amountSats/:paymentPublicKey/:paymentAddress/:feeMultiplier", async (req, res, next) => {
  try {
    const response = await controller.getPsbtForWithdrawal(req.params.withdrawalAddress, req.params.signature, Number(req.params.amountSats), req.params.paymentPublicKey, req.params.paymentAddress, Number(req.params.feeMultiplier));
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
    return res.send(result);
  } catch (error) {
    console.log('Error in routes: ', error)
    return res.status(500).send({failed: true, message: error.message})
    //next('An error occurred broadcast-deposit.')
  }
});

/**
 * Client performed the broadcast - 
 */
router.post("/client-broadcast-deposit", async (req, res, next) => {
  try {
    const tx = req.body;
    const result = await controller.clientBroadcastDeposit(tx);
    return res.send(result);
  } catch (error) {
    console.log('Error in routes: ', error)
    next('An error occurred client-broadcast-deposit.') 
  }
});


router.get('*', function(req, res) {
  res.sendStatus(404);
});

export { router as opReturnRoutes }
