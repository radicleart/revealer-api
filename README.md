# uasu-api

Node Server for UASU proxy server.

## Swagger API Docs

- [swagger docs](https://app.uasu.finance/uasu-api/docs/).

## Build

```bash
node -v
v19.7.0

npm install
npm run build
```

### Locally on regtest

See also [API README](https://github.com/radicleart/uasu-api)

```bash
npm run devenv
```

## Dev

Run locally with bitcoin regtest network;

```bash
Bitcoin-Qt -regtest -datadir=${home}/Library/Application\ Support/Bitcoin -conf=${home}/Library/Application\ Support/Bitcoin/regtest/bitcoin.conf
npm run sim
```

Run locally on bitcoin testnet network;

```bash
Bitcoin-Qt -testnet -datadir=${home}/Library/Application\ Support/Bitcoin/testnet -conf=${home}/Library/Application\ Support/Bitcoin/testnet/bitcoin.conf
npm run dev
```

### Mongo

Connects to Mongo Cloud development db instance using environment variables see Environment secton.

Local IP address has to be added to Mongo Cloud allowed network - contact system administrator.

### Environment

Environment is set on target server ad injected via docker variables. Config for running
locally without docker is set i `$lib/config.ts`

## Test

Tests outstanding,

```bash
npm run test
```

## Deploy

Currently builds to Linode via ssh and rsync.

### Mongo Production

Connects to Mongo Cloud db instance using environment variable stored on the target VM.

### Docker Run

```bash
# prod
docker rm -f uasu_api_production
docker run -d -t -i --network host --name uasu_api_production -p 5010:5010 -e TARGET_ENV='linode-production' -e btcSchnorrReveal=${UASU_BTC_SCHNORR_KEY_REVEAL} -e btcSchnorrReclaim=${UASU_BTC_SCHNORR_KEY_RECLAIM} -e btcSchnorrOracle=${UASU_BTC_SCHNORR_KEY_ORACLE} -e btcRpcUser=${UASU_BTC_RPC_USER} -e btcRpcPwd=${UASU_BTC_RPC_PWD} -e btcNode=${UASU_BTC_NODE} -e mongoDbUrl=${UASU_MONGO_SBTC_URL} -e mongoDbName=${UASU_MONGO_SBTC_DBNAME} -e mongoUser=${UASU_MONGO_SBTC_USER} -e mongoPwd=${UASU_MONGO_SBTC_PWD} -e mailChimpApiKey=${UASU_MAILCHIMP_KEY} -e mailChimpAudience=${UASU_MAILCHIMP_AUDIENCE} mijoco/uasu_api
```

```bash
# stag
docker rm -f uasu_api_staging
docker run -d -t -i --network host --name uasu_api_staging -p 5010:5010 -e TARGET_ENV='linode-staging' -e btcRpcUser=${UASU_BTC_RPC_USER} -e btcRpcPwd=${UASU_BTC_RPC_PWD} -e btcNode=${UASU_BTC_NODE} -e mongoDbUrl=${UASU_MONGO_SBTC_URL} -e mongoDbName=${UASU_MONGO_SBTC_DBNAME} -e mongoUser=${UASU_MONGO_SBTC_USER} -e mongoPwd=${UASU_MONGO_SBTC_PWD} -e mailChimpApiKey=${UASU_MAILCHIMP_KEY} -e mailChimpAudience=${UASU_MAILCHIMP_AUDIENCE} -e sbtcContractId=${UASU_SBCT_CID} -e dlcLenderCid=${UASU_DLC_LENDER_CID} -e dlcManagerCid=${UASU_DLC_MANAGER_CID} -e stacksApi=${UASU_STACKS_API} -e bitcoinExplorerUrl=${UASU_BITCOIN_EXPLORER_URL} -e mempoolUrl=${UASU_MEMPOOL_URL} -e blockCypherUrl=${UASU_BLOCK_CYPHER_URL} -e publicAppName=${UASU_PUBLIC_APP} -e publicAppVersion=${UASU_PUBLIC_APP_VERSION} -e host=${UASU_HOST} -e port=${UASU_PORT} -e walletPath=${UASU_WALLET_PATH} mijoco/uasu_api
```

```bash
# stag
docker rm -f uasu_api_devnet
docker run -d -t -i --network host --name uasu_api_devnet -p 5010:5010 -e TARGET_ENV='linode-staging' -e btcRpcUser=${UASU_BTC_RPC_USER} -e btcRpcPwd=${UASU_BTC_RPC_PWD} -e btcNode=${UASU_BTC_NODE} -e mongoDbUrl=${UASU_MONGO_SBTC_URL} -e mongoDbName=${UASU_MONGO_SBTC_DBNAME} -e mongoUser=${UASU_MONGO_SBTC_USER} -e mongoPwd=${UASU_MONGO_SBTC_PWD} -e mailChimpApiKey=${UASU_MAILCHIMP_KEY} -e mailChimpAudience=${UASU_MAILCHIMP_AUDIENCE} -e sbtcContractId=${UASU_SBCT_CID} -e dlcLenderCid=${UASU_DLC_LENDER_CID} -e dlcManagerCid=${UASU_DLC_MANAGER_CID} -e stacksApi=${UASU_STACKS_API} -e bitcoinExplorerUrl=${UASU_BITCOIN_EXPLORER_URL} -e mempoolUrl=${UASU_MEMPOOL_URL} -e blockCypherUrl=${UASU_BLOCK_CYPHER_URL} -e publicAppName=${UASU_PUBLIC_APP} -e publicAppVersion=${UASU_PUBLIC_APP_VERSION} -e host=${UASU_HOST} -e port=${UASU_PORT} -e walletPath=${UASU_WALLET_PATH} mijoco/uasu_api
```

Overrides:

```bash
export UASU_MAILCHIMP_AUDIENCE=cf9d92c7db
export UASU_MAILCHIMP_KEY=9f34bc871c6ea31c75810ca57da1e40e-us10
export UASU_MONGO_SBTC_USER=staguasu1
export UASU_MONGO_SBTC_PWD=vvDRivVCiuZd88SK
export UASU_MONGO_SBTC_URL=cluster0.ovgne2s.mongodb.net
export UASU_MONGO_SBTC_DBNAME=uasu-db-stag
export UASU_BTC_NODE=127.0.0.1:18332
export UASU_BTC_RPC_USER=bob
export UASU_BTC_RPC_PWD=theraininspainstaysmainlyintheplain
export UASU_BTC_SCHNORR_KEY_REVEAL=8854e0f3b4979edc55330722626ce4e12f67ef89f0ac00032d18e6da3a2dc60b
export UASU_BTC_SCHNORR_KEY_RECLAIM=1eba17807c82b0aa676b85839ea84663ceb6fbbfb3e0a23a2bdae9cd3df096cb
export UASU_BTC_SCHNORR_KEY_ORACLE=8181ea91f5f8e9273dc333e04abefa06ac942d85a4081684ccf3534884a66f8c
export UASU_HOST=http://localhost
export UASU_PORT=5010
export UASU_WALLET_PATH=
export UASU_SBCT_CID=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.asset
export UASU_DLC_LENDER_CID=STNHKEPYEPJ8ET55ZZ0M5A34J0R3N5FM2CMMMAZ6.uasu-sbtc-loan-v1
export UASU_DLC_MANAGER_CID=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.dlc-manager-v1
export UASU_STACKS_API=http://45.79.130.153:3999
export UASU_BITCOIN_EXPLORER_URL=http://45.79.130.153:8083
export UASU_MEMPOOL_URL=http://45.79.130.153:8083/api
export UASU_BLOCK_CYPHER_URL=http://45.79.130.153:8083/api
export UASU_PUBLIC_APP_NAME="UASU Devenv API"
export UASU_PUBLIC_APP_VERSION=1.0.0
```
