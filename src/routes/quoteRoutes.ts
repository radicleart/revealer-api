import express from "express";
import { addCustomer, addRequestForQuote, getRequestForQuotes, getRequestForQuote, getRequestForQuotesByOriginator, updateRequestForQuote } from "../lib/data/db_models.js";
import { decodePSBT } from "./controllers/bitcoin/rpc_wallet.js";
import { QuoteI } from "../types/loans.js";

const router = express.Router();

router.post("/request", async (req, res, next) => {
  try {
    const requestForQuote:QuoteI = req.body;
    console.log('saving: ', requestForQuote)
    const c = await addRequestForQuote(requestForQuote);
    console.log("/uasu-api/:network/v1/requestForQuote", c)
    return res.send(c);
  } catch (error) {
    next('An error occurred saving new quote.')
  }
});

router.put("/request", async (req, res, next) => {
  try {
    const requestForQuote:QuoteI = req.body;
    console.log('requestForQuote.acceptPSBTHexAliceDecoded: ', requestForQuote)
    if (requestForQuote.acceptPSBTHexAlice) {
      if (!requestForQuote.acceptPSBTHexAliceDecoded) {
        console.log('requestForQuote.acceptPSBTHexAliceDecoded: ')
        requestForQuote.acceptPSBTHexAliceDecoded = await decodePSBT(requestForQuote.acceptPSBTHexAlice)
        console.log('requestForQuote.acceptPSBTHexAliceDecoded: ', requestForQuote.acceptPSBTHexAliceDecoded)
      }
    }
    if (requestForQuote.acceptPSBTHexBob) {
      if (!requestForQuote.acceptPSBTHexBobDecoded) {
        console.log('requestForQuote.acceptPSBTHexBobDecoded: ')
        requestForQuote.acceptPSBTHexBobDecoded = await decodePSBT(requestForQuote.acceptPSBTHexBob)
        console.log('requestForQuote.acceptPSBTHexBobDecoded: ', requestForQuote.acceptPSBTHexBobDecoded)
      }
    }
    console.log('updateRequestForQuote 2: ')
    const c = await updateRequestForQuote(requestForQuote);
    console.log("/requests", c)
    return res.send(c);
  } catch (error) {
    next('An error occurred updating quote.')
  }
});

router.get("/request/:id", async (req, res, next) => {
  try {
    const response = await getRequestForQuote(req.params.id);
    return res.send(response);
  } catch (error) { 
    console.log('Error in routes: ', error)
    next('An error occurred fetching sbtc data.') 
  }
});

router.get("/requests", async (req, res, next) => {
  try {
    const response = await getRequestForQuotes();
    return res.send(response);
  } catch (error) { 
    console.log('Error in routes: ', error)
    next('An error occurred fetching sbtc data.') 
  }
});

router.get("/getRequestForQuotesByOriginator/:originator", async (req, res, next) => {
  try {
    const response = await getRequestForQuotesByOriginator(req.params.originator);
    return res.send(response);
  } catch (error) {
    console.log('Error in routes: ', error)
    next('An error occurred fetching sbtc data.') 
  }
});

router.get('*', function(req, res) {
  res.sendStatus(404);
});

export { router as quoteRoutes } 
