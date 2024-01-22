import express from "express";
import { CommitController } from "./CommitController.js";
import { CommitmentRequest } from "../../types/revealer_types.js";

const router = express.Router();
const controller = new CommitController()

router.post("/sbtc-deposit", async (req, res, next) => {
  try {
    const commitRequest:CommitmentRequest = req.body;
    const response = await controller.saveSBTCCommitment(commitRequest);
    return res.send(response);
  } catch (error) {
    console.log('Error in routes: ', error)
    next('An error occurred fetching sbtc data.')
  }
});

router.post("/inscription", async (req, res, next) => {
  try {
    const commitRequest:CommitmentRequest = req.body;
    const response = await controller.saveInscriptionCommitment(commitRequest);
    return res.send(response);
  } catch (error) {
    console.log('Error in routes: ', error)
    next('An error occurred fetching sbtc data.')
  }
});

router.get("/:paymentAddress", async (req, res, next) => {
  try {
    const response = await controller.getCommitmentByPaymentAddress(req.params.paymentAddress);
    return res.send(response);
  } catch (error) {
    console.log('Error in routes: ', error)
    next('An error occurred fetching sbtc data.')
  }
});

router.get('*', function(req, res) {
  res.sendStatus(404);
});

export { router as commitRoutes }
