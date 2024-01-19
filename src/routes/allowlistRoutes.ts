import express from "express";
import {addAddressToAllowlist, addManyAddressesToAllowlist, isAllowlisted } from "../lib/data/db_models.js";
import { Allowlist } from "../types/loans.js";
const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    let c:any = undefined;
    // const customer:CustomerI = req.body;
    if(req.body as Allowlist !== null){
      const allowlist:Allowlist = req.body;
      c = await addAddressToAllowlist(allowlist);
    } else {
      const allowlist:any = req.body;
      c = await addManyAddressesToAllowlist(allowlist);
    }
    return res.send(c);
  } catch (error) {
    console.log(error)
    next('An error occurred fetching allowlist data.') 
  }
});



router.get("/:address", async (req, res, next) => {
  try {
    const address:string = req.params.address;
    const response = await isAllowlisted(address);
    return res.send(response);
  } catch (error) {
    console.log('Error in routes: ', error)
    next('An error occurred fetching allowlist data.') 
  }
});

// router.put("/allowlist", async (req, res, next) => {
//   const allowlist:Allowlist = req.body;
//   const c = await removeAddressFromAllowlist(allowlist);
//   return res.send(c);
// });


router.get('*', function(req, res) {
  res.sendStatus(404);
});

export { router as allowlistRoutes } 
