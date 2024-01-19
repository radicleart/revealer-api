import { getConfig } from "../../../lib/config.js";
import fetch from 'node-fetch';
import { CustomerI, CustomerStatus } from "../../../types/loans.js";

const MAIL_CHIMP_URL = 'https://us10.api.mailchimp.com/3.0/lists/'
export async function sendToMailChimp(customer:CustomerI) {
  const addData = {
    members: [
       {
          email_address: customer.email_address,
          status: CustomerStatus.pending
       }
    ]
  }
  const url =  MAIL_CHIMP_URL + getConfig().mailChimpAudience
  const options = {
    method: 'POST',
    headers: {
       Authorization: 'auth ' + getConfig().mailChimpApiKey
    },
    body: JSON.stringify(addData)
  }
  const response = await fetch(url, options);
  const result = await response.json();
  return result
}
