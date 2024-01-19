import express from "express";
import { addCustomer } from "../lib/data/db_models.js";
import { sendToMailChimp } from "./controllers/customer/mailchimp_helper.js";
import { CustomerI } from "../types/loans.js";

const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const customer:CustomerI = req.body;
    await addCustomer(customer);
    const result = await sendToMailChimp(customer)
    console.log(result)
    return res.send(result);
  } catch (error) {
    console.log('Email already taken: ')
    next('An error occurred fetching sbtc data.') 
  }
});


export { router as customerRoutes } 
