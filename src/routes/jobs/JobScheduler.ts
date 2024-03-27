import cron from 'node-cron';
import { scanUnpaidTransactions } from '../transactions/transactionScanner.js';
import { updateExchangeRates } from '../../lib/rates_utils.js';

export const sbtcEventJob = cron.schedule('*/17 * * * *', (fireDate) => {
  console.log('Running: sbtcEventJob at: ' + fireDate);
  try {
    //saveAllSbtcEvents();
  } catch (err) {
    console.log('Error running: saveAllSbtcEvents: ', err);
  }
});

export const scanForPaymentsJob = cron.schedule('*/10 * * * *', (fireDate) => {
  console.log('Running: peginRequestJob at: ' + fireDate);
  try {
    scanUnpaidTransactions();
  } catch (err) {
    console.log('Error running: scanForPaymentsJob: ', err);
  }
});

export const exchangeRates = cron.schedule('*/2 * * * *', (fireDate) => {
  console.log('Running: exchangeRates at: ' + fireDate);
  try {
    updateExchangeRates();
  } catch (err) {
    console.log('Error running: exchangeRates: ', err);
  }
});
