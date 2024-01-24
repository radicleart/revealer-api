import { Body, Get, Post, Route } from "tsoa";
import { getConfig } from "../../lib/config.js";
import { CommitmentType, CommitmentStatus, UTXO, CommitmentRequest, CommitmentResponse, RequestType, CommitmentError } from "../../types/revealer_types.js";
import { getCommitPaymentPsbt, getCommitmentForInscription, getCommitmentForSbtcDeposit } from "./commitHelper.js";
import { findCommitmentByPaymentAddress, findCommitmentsPendingByOriginator, saveCommitment } from "./commitment_db.js";

/**
 * Builds and stores commitment transactions for sbtc commit reveal patterns
 */
@Route("/revealer-api/v1/commitment")
export class CommitController {

  
  /**
   * Fetches the commitment data for a payment address
   * @param paymentAddress 
   * @returns 
   */
  @Get("/pending/:originator/:requestType")
  public async getCommitmentsPendingByOriginator(originator:string, requestType:string): Promise<CommitmentResponse|undefined> {
    try {
      const commitment:CommitmentType = await findCommitmentsPendingByOriginator(originator, requestType);
      if (!commitment) return
      let paymentPsbt;
      if (commitment.commitmentRequest.payFromAddress) {
        paymentPsbt = await getCommitPaymentPsbt(commitment.commitmentRequest.revealFee, commitment.taprootScript.address, commitment.commitmentRequest.payFromAddress);
      }
      return {
        commitAddress: commitment.taprootScript.address,
        paymentPsbt: paymentPsbt,
        commitTxId: commitment.commitTxId,
        recipientStxPrincipal: commitment.commitmentRequest.recipientStxPrincipal,
        inscriptionPayload: commitment.commitmentRequest.inscriptionPayload
      };
    } catch(err) {
      throw new Error(err.message);
    }
  }

  @Get("/:paymentAddress")
  public async getCommitmentByPaymentAddress(paymentAddress:string): Promise<CommitmentType|undefined> {
    try {
      const commitment = await findCommitmentByPaymentAddress(paymentAddress);
      return commitment;
    } catch(err) {
      throw new Error(err.message);
    }
  }

  /**
   * Build and save the commitment data for a taproot inscription. Return the address for invoice.
   * If payFromAddress is provided also returns a payment psbt for the web wallet.
   * @param CommitmentRequest 
   * @returns CommitmentResponse
   */
  @Post("/inscription")
  public async saveInscriptionCommitment(@Body() commitmentRequest:CommitmentRequest): Promise<CommitmentResponse> {
    try {
      const taprootScript = getCommitmentForInscription(commitmentRequest);
      const commitment:CommitmentType = {
        commitmentRequest,
        network: getConfig().network,
        taprootScript,
        status: CommitmentStatus.UNPAID, 
        requestType: RequestType.INSCRIPTION,
        created: new Date().getTime(),
        updated: new Date().getTime()
      }
      saveCommitment(commitment)
      let paymentPsbt
      if (commitmentRequest.payFromAddress) {
        paymentPsbt = await getCommitPaymentPsbt(commitmentRequest.revealFee, commitment.taprootScript.address, commitmentRequest.payFromAddress);
      }
      return { paymentPsbt, commitAddress: commitment.taprootScript.address };
    } catch(err) {
      throw new Error(err.message);
    }
  }

  /**
   * Build and save the commitment data for an sbtc deposit. Return the address for invoice.
   * If payFromAddress is provided also returns a payment psbt for the web wallet.
   * @param commitmentRequest
   * @returns CommitmentResponse
   */
    @Post("/sbtc-deposit")
    public async saveSBTCCommitment(@Body() commitmentRequest:CommitmentRequest): Promise<CommitmentResponse> {
      try {
        const taprootScript = getCommitmentForSbtcDeposit(commitmentRequest);
        const commitment:CommitmentType = {
          commitmentRequest,
          network: getConfig().network,
          taprootScript,
          status: CommitmentStatus.UNPAID, 
          requestType: RequestType.SBTC_DEPOSIT,
          created: new Date().getTime(),
          updated: new Date().getTime()
        }
        saveCommitment(commitment)
  
        let paymentPsbt
        if (commitmentRequest.payFromAddress) {
          paymentPsbt = getCommitPaymentPsbt(commitmentRequest.revealFee, commitment.taprootScript.address, commitmentRequest.payFromAddress);
        }
        return { paymentPsbt, commitAddress: commitment.taprootScript.address };
      } catch(err) {
        throw new Error(err.message);
      }
    }
  
}
