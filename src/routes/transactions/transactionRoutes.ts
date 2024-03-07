import express from "express";
import { TransactionController } from "./TransactionController.js";

const router = express.Router();
const controller = new TransactionController()

router.get("/scan-sbtc-wallet-transaction/:txid", async (req, res, next) => {
  try {
    const response = await controller.scanSbtcWalletTransaction(req.params.txid);
    if (response) {
      return res.send(response);
    }
    return res.status(404).send({failed: true, message: 'none here'}); //Send error response here
  } catch (error) {
    return res.status(500).send({failed: true, message: error.message})
  }
});

router.get("/scan-sbtc-wallet-transactions/:address", async (req, res, next) => {
  try {
    const response = await controller.scanSbtcWalletTransactions(req.params.address);
    if (response) {
      return res.send(response);
    }
    return res.status(404).send({failed: true, message: 'none here'}); //Send error response here
  } catch (error) {
    return res.status(500).send({failed: true, message: error.message})
  }
});

router.get("/scan-unpaid", async (req, res, next) => {
  try {
    const response = await controller.scanUnpaidTransactions();
    if (response) {
      return res.send(response);
    }
    return res.status(404).send([]); //Send error response here
  } catch (error) {
    return res.status(500).send({failed: true, message: error.message})
  }
});

router.get("/scan-commitment-transactions/:address", async (req, res, next) => {
  try {
    const response = await controller.scanRevealerTransactionsByCommitAddress(req.params.address);
    if (response) {
      return res.send(response);
    }
    return res.status(404).send({failed: true, message: 'none here'}); //Send error response here
  } catch (error) {
    return res.status(500).send({failed: true, message: error.message})
  }
});

router.get("/check-revealer-transaction/:address", async (req, res, next) => {
  try {
    const response = await controller.checkRevealerTransactionByCommitAddress(req.params.address);
    return res.send(response);
  } catch (error) {
    return res.status(500).send({failed: true, message: error.message})
  }
});

router.get("/connect-revealer-transaction/:address/:txId", async (req, res, next) => {
  try {
    const response = await controller.connectRevealerTransactionByCommitAddress(req.params.address, req.params.txId);
    return res.send(response);
  } catch (error) {
    return res.status(500).send({failed: true, message: error.message})
  }
});



router.get("/get-revealer-transactions-by-commit-address/:address", async (req, res, next) => {
  try {
    const response = await controller.getRevealerTransactionByCommitAddress(req.params.address);
    if (response) {
      return res.send(response);
    }
    return res.status(404).send({failed: true, message: 'none here'}); //Send error response here
  } catch (error) {
    return res.status(500).send({failed: true, message: error.message})
  }
});

router.get("/get-revealer-transactions-by-originator/:address/:page/:limit", async (req, res, next) => {
  try {
    const response = await controller.getRevealerTransactionByOriginator(req.params.address, Number(req.params.page), Number(req.params.limit));
    if (response) {
      return res.send(response);
    }
    return res.status(404).send({failed: true, message: 'none here'});
  } catch (error) {
    return res.status(500).send({failed: true, message: error.message})
  }
});

router.get("/get-revealer-transactions-by-txid/:txId", async (req, res, next) => {
  try {
    const response = await controller.getRevealerTransactionByTxId(req.params.txId);
    if (response) {
      return res.send(response);
    }
    return res.status(404).send({failed: true, message: 'none here'});
  } catch (error) {
    return res.status(500).send({failed: true, message: error.message})
  }
});

router.get("/get-revealer-transactions-pending-by-originator/:address", async (req, res, next) => {
  try {
    const response = await controller.getRevealerTransactionPendingByOriginator(req.params.address);
    if (response) {
      return res.send(response);
    }
    return res.status(404).send({failed: true, message: 'none here'});
  } catch (error) {
    return res.status(500).send({failed: true, message: error.message})
  }
});

router.get("/get-revealer-transactions/:page/:limit", async (req, res, next) => {
  try {
    const response = await controller.getRevealerTransactions(Number(req.params.page), Number(req.params.limit));
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

export { router as transactionRoutes }
