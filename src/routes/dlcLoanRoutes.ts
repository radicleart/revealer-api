import express from "express";
import { DLCLinkController } from "./controllers/dlclink/DLCLinkController.js";
import { checkLiquidation, getCreatorLoans, getLoan, getLoanId } from "./controllers/dlc-loans/loans_helper.js";
import { addLockResponse, getLockResponse, getLockResponses } from "../lib/data/db_models.js";
import { LockResponse } from "../types/loans.js";

/**
 * Routes relating to generic DLC functions
 */

const router = express.Router();

router.get("/check-liquidation/:loanId/:btcPrice", async (req, res, next) => {
  try {
    const response = await checkLiquidation(Number(req.params.loanId), Number(req.params.btcPrice));
    return res.send(response);
  } catch (error) {
    console.log('An error occurred get-creator-loans: ', error)
    next('An error occurred get-creator-loans.')
  }
});

router.get("/get-creator-loans/:stacksAddess/:btcPrice", async (req, res, next) => {
  try {
    const response = await getCreatorLoans(req.params.stacksAddess, Number(req.params.btcPrice));
    return res.send(response);
  } catch (error) {
    console.log('An error occurred get-creator-loans: ', error)
    next('An error occurred get-creator-loans.')
  }
});

router.get("/loan/:uuid/:btcPrice", async (req, res, next) => {
  try {
    const response = await getLoan(req.params.uuid, Number(req.params.btcPrice));
    return res.send(response);
  } catch (error) {
    console.log('An error occurred get-creator-loans: ', error)
    next('An error occurred get-creator-loans.') 
  }
});

router.get("/lock-response/:stacksAddess", async (req, res, next) => {
  try {
    const response = await getLockResponses(req.params.stacksAddess);
    return res.send(response);
  } catch (error) {
    console.log('An error occurred get-lock-results: ', error)
    next('An error occurred get-lock-results.') 
  }
});

router.get("/lock-response-by-uuid/:uuid", async (req, res, next) => {
  try {
    const response = await getLockResponse(req.params.uuid);
    return res.send(response);
  } catch (error) {
    console.log('An error occurred get-lock-results: ', error)
    next('An error occurred get-lock-results.') 
  }
});

router.get("/loan-id-by-uuid/:uuid", async (req, res, next) => {
  try {
    const response = await getLoanId(req.params.uuid);
    return res.send(response);
  } catch (error) {
    console.log('An error occurred get-loan-id: ', error)
    next('An error occurred  get-loan-id.') 
  }
});


router.post("/lock-response", async (req, res, next) => {
  try {
    const lockResult:LockResponse = req.body;
    const result = await addLockResponse(lockResult);
    console.log(result)
    return res.send(result);
  } catch (error) {
    console.log('n error occurred add-lock-result: ', req.body)
    next('An error occurred add-lock-result.') 
  }
});



export { router as dlcLoanRoutes }
