import express from "express";
import { OpDropRequest } from "../../types/revealer_types.js";
import { OpDropController } from "./OpDropController.js";

const router = express.Router();
const controller = new OpDropController()

router.post("/get-commitment-address", async (req, res, next) => {
  try {
    const deposit:OpDropRequest = req.body;
    const response = await controller.getCommitmentAddress(deposit);
    if (response) {
      return res.send(response);
    }
    return res.status(404).send({failed: true, message: 'none here'}); //Send error response here
  } catch (error) {
    return res.status(500).send({failed: true, message: error.message})
  }
});

router.get('*', function(req, res) {
  res.sendStatus(404);
});

export { router as opDropRoutes }
