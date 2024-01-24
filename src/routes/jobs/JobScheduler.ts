import cron from 'node-cron';
import { scanForPayments } from '../commit/commitHelper';

export const scanForPaymentsJob = cron.schedule('*/11 * * * *', (fireDate) => {
  console.log('Running: peginRequestJob at: ' + fireDate);
  try {
    scanForPayments();
  } catch (err) {
    console.log('Error running: scanForPaymentsJob: ', err);
  }
});

