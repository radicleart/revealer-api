import cron from 'node-cron';
import { scanForPayments } from '../commit/commitHelper.js';
import { updateExchangeRates } from '../../lib/rates_utils.js';

export const scanForPaymentsJob = cron.schedule('*/2 * * * *', (fireDate) => {
  console.log('Running: peginRequestJob at: ' + fireDate);
  try {
    scanForPayments();
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
