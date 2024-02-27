import express from "express";
import { OpReturnController } from "./OpReturnController.js";
import { OpReturnRequest } from "../../types/revealer_types.js";

const router = express.Router();
const controller = new OpReturnController()

router.post("/get-psbt-for-deposit", async (req, res, next) => {
  try {
    const deposit:OpReturnRequest = req.body;
    const response = await controller.getPsbtForDeposit(deposit);
    if (response) {
      return res.send(response);
    }
    return res.status(404).send({failed: true, message: 'none here'}); //Send error response here
  } catch (error) {
    return res.status(500).send({failed: true, message: error.message})
  }
});

router.post("/get-psbt-for-withdrawal", async (req, res, next) => {
  try {
    //const originator = req.headers.authorization
    //if (originator !== withdrawal.originator) {
    //  return res.status(401)
    //}
    const withdrawal:OpReturnRequest = req.body;
    const response = await controller.getPsbtForWithdrawal(withdrawal);
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
router.post("/update-deposit", async (req, res, next) => {
  try {
    const tx = req.body;
    const result = await controller.clientBroadcastDeposit(tx);
    return res.send(result);
  } catch (error) {
    console.log('Error in routes: ', error)
    next('An error occurred update-deposit.') 
  }
});


router.get('*', function(req, res) {
  res.sendStatus(404);
});

export { router as opReturnRoutes }
