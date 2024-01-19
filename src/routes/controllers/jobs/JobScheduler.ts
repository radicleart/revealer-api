import cron from 'node-cron';
import { jobSaveDLCEvents } from '../dlclink/dlc_helper';

export const updateEventLogJob = cron.schedule('*/5 * * * *', (fireDate) => {
  console.log('Running: sbtcEventJob at: ' + fireDate);
});

export const dlcManagerEvents = cron.schedule('*/5 * * * *', (fireDate) => {
  console.log('Running: sbtcEventJob at: ' + fireDate);
  try {
    jobSaveDLCEvents();
  } catch (err) {
    console.log('Error running: jobSaveDLCEvents: ', err);
  }
});
