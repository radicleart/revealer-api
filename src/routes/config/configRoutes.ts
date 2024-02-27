import { ConfigController } from "./ConfigController.js"

import express from 'express';
const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const controller = new ConfigController();
    const response = await controller.getAllParam();
    return res.send(response);
  } catch (error) { 
    console.log('Error in routes: ', error)
    next('An error occurred fetching sbtc data.') 
  }
});

export { router as configRoutes } 
