import express from "express";
import { CommitController } from "./CommitController.js";
import { CommitmentRequest } from "../../types/revealer_types.js";

const router = express.Router();
const controller = new CommitController()

router.get("/pending/:originator/:requestType", async (req, res, next) => {
  try {
    const response = await controller.getCommitmentsPendingByOriginator(req.params.originator, req.params.requestType);
    if (response) {
      return res.send(response);
    }
    return res.status(404).send({failed: true, message: 'none here'}); //Send error response here
  } catch (error) {
    return res.status(500).send({failed: true, message: error.message})
  }
});

router.get("/:paymentAddress", async (req, res, next) => {
  try {
    const response = await controller.getCommitmentByPaymentAddress(req.params.paymentAddress);
    if (response) {
      return res.send(response);
    }
    return res.send(response);
  } catch (error) {
    return res.status(500).send({failed: true, message: error.message})
  }
});

router.post("/sbtc-deposit", async (req, res, next) => {
  try {
    const commitRequest:CommitmentRequest = req.body;
    const response = await controller.saveSBTCCommitment(commitRequest);
    return res.send(response);
  } catch (error) {
    return res.status(500).send({failed: true, message: error.message})
  }
});

router.post("/inscription", async (req, res, next) => {
  try {
    const commitRequest:CommitmentRequest = req.body;
    const response = await controller.saveInscriptionCommitment(commitRequest);
    return res.send(response);
  } catch (error) {
    return res.status(500).send({failed: true, message: error.message})
  }
});

router.get('*', function(req, res) {
  res.sendStatus(404);
});

export { router as commitRoutes }
