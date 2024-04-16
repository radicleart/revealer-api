# Design - Deposit API

This ticket holds the design of the Deposit API and the context around how it fits into sBTC-v1. It should specify the API calls that should be supported and justify them.

<!-- You are creating this discussion to ultimately finalize an engineering approach.

Design discussions are a vehicle for engineering conversations; they are an auditable artifact that
tracks a decision and how it was made, and formalizes a path to cementing a final design. These
discussions allow us to inspect our decision making process and later verify that the decisions we
made used the latest information and prevent design changes from occurring during implementation that
aren’t beneficial to the previously considered constraints. -->

## 1. Summary

The Deposit API facilitates bitcoin deposits into sBTC from any type of wallet. It provides an alternative to using the op_return op code to carry layer 2 protocol data which requires non standard bitcoin transaction and places limitations on the the consumer wallet software that can be used to access the system.

Associated research:

1. [Revealer API](https://github.com/stacks-network/sbtc/discussions/345)
2. [sBTC Research - OP_RETURN vs OP_DROP](https://github.com/stacks-network/sbtc/discussions/315)
3. [Design Implementation of Commit Reveal](https://github.com/stacks-network/sbtc/discussions/314)
4. [DOS attack](https://github.com/Trust-Machines/sbtc-v1/issues/23)
5. [sBTC Deposit UTXO Binary Format](https://github.com/Trust-Machines/sbtc-v1/issues/30)
6. [sBTC Deposit - Diagram and Flow](https://github.com/Trust-Machines/sbtc-v1/discussions/8)

## 2. Context & Purpose

To avoid the above problem, a two phase commit/reveal mechanism has been proposed that allows users to deposit from any bitcoin wallet. The user `commits` (sends bitcoin) to a taproot address via a standard bitcoin transaction.

## 2.1 Payload Data

The taproot tree has the following properties;

1. Provably unspendable key path spend
2. two script paths
   - reveal script - spendable by signers
   - reclaim script - spendable by user (after elapsed time)

The Deposit API provides an end point for the user to generate the commitment address and stores the commitment data. The input required to generate the scripts is;

1. the stacks principal (account or contract) that's to be the recipient of the sBTC
2. the users public key (e.g. from connected wallet) for the reclaim script path
3. max fee - the maximum fee the user is willing to pay in bitcoin gas for the signers to reveal the data - see comments below and [5].

and the structure of the scripts is as follows;

***reveal path***

```bash
<sbtc_payload> DROP <signers_pubkey> CHECKSIG
```

where ***sbtc_payload***, [see](https://github.com/Trust-Machines/sbtc-v1/issues/30);

```text
0               8                                          159
|---------------|-------------------------------------------|
   max_fee             recipient_address
```

note the ***areas of ambiguity*** on whether max_fee is included in the payload or inferred from the deposit tx fee?

a suggestion that refines the recipient_address for the payload [has been described previously](https://github.com/stacks-network/sbtc/blob/main/sbtc-core/src/operations/op_return/deposit.rs);

```text
3         4         5                25       26                         N <= 66
|---------|---------|-----------------|--------|-------------------------------|
principal  address       address       contract          contract name
type       version       hash          name length                 
```

note, bytes 0-3 are the magic and op code.

***reclaim path***

The specific reclaim script path is orthogonal to the overall sBTC design but could take following forms (note that OP_CSV is simpler to implement and decipher);

```bash
<lock-time> CHECKLOCKTIMEVERIFY DROP <user_pubkey> CHECKSIG
or
<lock_time> CHECKSEQUENCEVERIFY <reclaim script>
```

the lock-time, be it relative or absolute, must be at least 1 full PoX cycle from when the deposit is confirmed.

## 2.2 Consolidation

As per [this comment](https://github.com/stacks-network/sbtc/discussions/345#discussioncomment-7452311) the signers periodically check for pending deposits and consolidate them them into a UTxO in the current sBTC wallet.

***Question*** is a coordinator needed here or can the signers wait a random time interval before polling and failing (in bitcoin mempool) in event two signers attempt to consolidate the same set of pending UTxOs ?

Then, once the deposits are consolidated (1 bitcoin block), either;

1. the signers send the sbtc-payload and merkle proof to the .sbtc contract in a Stacks transaction

2. the consolidation transaction contains an OP_RETURN that allows the stacks node to directly call the .sbtc contract, removing the need for a signer voting round. ***Question - v2 ?***

## 3. Design

### 3.1 Proposed Component Design

A centralised RPC API approach is viable for sBTC-v1 other approaches are considered below.

### 3.1.1 Design Diagram

### 3.1.1.1 Signers poll for pending deposits

Signers control the paging.

![1](https://github.com/Trust-Machines/sbtc-v1/assets/4384929/496a8635-4966-4931-8375-9a50196762a0)

### 3.1.1.2 Signers poll for specific deposit

Signers poll by bitcoin txid.

![2](https://github.com/Trust-Machines/sbtc-v1/assets/4384929/4c98baa2-f080-4b7f-b8dd-762503484417)

### 3.1.1.3 User reclaim flow

User attempt to reclaim.

![3](https://github.com/Trust-Machines/sbtc-v1/assets/4384929/ebe8d21b-574c-4af8-9c55-5d5e64da1a04)

### 3.1.2 API Calls

Assuming the Signers poll for pending deposit transactions.

| HTTP | API Call                | Request Body   | Params                | Response                | Success | Error |
| ---- | ----------------------- | -------------- | --------------------- | ----------------------- | ------- | ----- |
| POST | /get-deposit-address    | DepositRequest | -                     | DepositResponse         | 200     | 40x   |
| GET  | /reclaim-address        |                |                       | String<PSBT>            | 200     | 40x   |
| GET  | /get-pending-deposits   |                | PendingDepositsParams | PendingDepositsResponse | 200     | 40x   |
| GET  | /get-deposit            |                | txid                  | PendingDeposit          | 200     | 40x   |

See appendix 1 for definition of api parameters.

***/get-deposit-address****

The user supplies the recipient stacks principal for the sBTC mint and the API encodes this data into taproot script path, spendable by the current sBTC signers, and returns the address generated for the user deposit.

The user also supplies a public key for the reclaim script path and optionally a value for max_fee.

Note: /get-deposit-address is a potential source of attack - see [DOS attack](https://github.com/Trust-Machines/sbtc-v1/issues/23).

***/get-pending-deposits***

Signers poll for deposits that have been paid by the user.

Returns empty list if none exist

***/get-deposit***

Signers request data for a specific deposit that has been paid by the user.

Return 404 if paid transaction is not found.

***/reclaim-deposit***

User attempts to reclaim deposit. API checks for the unspent TxO and for expiry of lock time. If ok generate an unsigned PSBT for the user to sign and broadcast.

Return 40x indicating conditions not met.

### 3.1.3 Considerations & Alternatives

1. commitment data is stored on chain - signers discover it via clarity - more complex and requires 2 transactions

2. commitment data is stored AND verified on stacks as per the discussion here; [sBTC Research - OP_RETURN vs OP_DROP](https://github.com/stacks-network/sbtc/discussions/315). In this scenario any bitcoin watcher can submit the transaction to the clarity contract, the contract verifies the transaction data and performs the mint - the signers no longer need to consolidate the UTxOs and can just spend them in the hand-off.

### 3.1.4 Security Considerations

The Deposit API is a centralised component required to enact the commit/reveal (OP_DROP) sBTC deposit flow.

To avoid exposing a public accessible IP on the signers it is recommended the signers pool the API.

Security concerns around using a centralised API can also be mitigated by deploying the OP_RETURN deposit flow as soon as possible.

### 3.2 Areas of Ambiguity

Open questions;

1. how to handle max fee
2. precise spec of sbtc_payload
3. exact data needed to be passed back to signers

---

## Closing Checklist

- [ ] The design proposed in this issue is clearly documented in the description of this ticket.
- [ ] Everyone necessary has reviewed the resolution and agrees with the proposal.
- [ ] This ticket has or links all the information necessary to familiarize a contributor with the design decision, why it was made, and how it'll be included.

## Appendix

### Appendix 1: API Request / Response

API Parameters;

| DepositRequest        | Type     | Description |
| --------------------- | -------- |------------ |
| originator            | string   | Stacks account initiating the deposit - may or may not be the recipient |
| recipient             | string   | Stacks account or contract principal |
| reclaimPublicKey      | string   | Public key for reclaim path |
| maxFee                | string   | Max fee the end user is prepared to pay for consolidation |

| DepositResponse       | Type     | Description |
| --------------------- | -------- | ----------- |
| commitAddress         | string   | The address for the user deposit |

| PendingDepositsRequest | Type     | Description                 |
| ---------------------- | -------- | --------------------------- |
| page                   | string   | Page of deposits to return  |
| limit                  | string   | Number of deposits per page |

| PendingDepositsResponse           | Type                  | Description                 |
| --------------------------------- | --------------------- | --------------------------- |
| total                             | number                | Total of pending deposits   |
| pendingDeposits                   | Array<PendingDeposit> | Tapscript data              |

| PendingDeposit         | Type                 | Description    |
| ---------------------- | -------------------- | -------------- |
| address                | string               | commit address |
| script                 | string/Uint8Array    |                |
| leaves                 | Array                |                |
| tapInternalKey         | string/Uint8Array    |                |
| tapLeafScript          | Array                |                |
| tapMerkleRoot          | string/Uint8Array    |                |
| tweakedPubkey          | string/Uint8Array    |                |
