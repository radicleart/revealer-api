# uasu-api

Node Server for REVEALER proxy server.

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
docker rm -f revealer_api_production
docker run -d -t -i --network host --name uasu_api_production -p 5010:5010 -e TARGET_ENV='linode-production' -e btcSchnorrReveal=${REVEALER_BTC_SCHNORR_KEY_REVEAL} -e btcSchnorrReclaim=${REVEALER_BTC_SCHNORR_KEY_RECLAIM} -e btcSchnorrOracle=${REVEALER_BTC_SCHNORR_KEY_ORACLE} -e btcRpcUser=${REVEALER_BTC_RPC_USER} -e btcRpcPwd=${REVEALER_BTC_RPC_PWD} -e btcNode=${REVEALER_BTC_NODE} -e mongoDbUrl=${REVEALER_MONGO_URL} -e mongoDbName=${REVEALER_MONGO_DBNAME} -e mongoUser=${REVEALER_MONGO_USER} -e mongoPwd=${REVEALER_MONGO_PWD} mijoco/uasu_api
```

```bash
# stag
docker rm -f revealer_api_staging
docker run -d -t -i --network host --name uasu_api_staging -p 5010:5010 -e TARGET_ENV='linode-staging' -e btcRpcUser=${REVEALER_BTC_RPC_USER} -e btcRpcPwd=${REVEALER_BTC_RPC_PWD} -e btcNode=${REVEALER_BTC_NODE} -e mongoDbUrl=${REVEALER_MONGO_URL} -e mongoDbName=${REVEALER_MONGO_DBNAME} -e mongoUser=${REVEALER_MONGO_USER} -e mongoPwd=${REVEALER_MONGO_PWD} -e dlcLenderCid=${REVEALER_DLC_LENDER_CID} -e dlcManagerCid=${REVEALER_DLC_MANAGER_CID} -e stacksApi=${REVEALER_STACKS_API} -e bitcoinExplorerUrl=${REVEALER_BITCOIN_EXPLORER_URL} -e mempoolUrl=${REVEALER_MEMPOOL_URL} -e blockCypherUrl=${REVEALER_BLOCK_CYPHER_URL} -e publicAppName=${REVEALER_PUBLIC_APP} -e publicAppVersion=${REVEALER_PUBLIC_APP_VERSION} -e host=${REVEALER_HOST} -e port=${REVEALER_PORT} -e walletPath=${REVEALER_WALLET_PATH} mijoco/uasu_api
```

```bash
# stag
docker rm -f revealer_api_devnet
docker run -d -t -i --network host --name uasu_api_devnet -p 5010:5010 -e TARGET_ENV='linode-staging' -e btcRpcUser=${REVEALER_BTC_RPC_USER} -e btcRpcPwd=${REVEALER_BTC_RPC_PWD} -e btcNode=${REVEALER_BTC_NODE} -e mongoDbUrl=${REVEALER_MONGO_URL} -e mongoDbName=${REVEALER_MONGO_DBNAME} -e mongoUser=${REVEALER_MONGO_USER} -e mongoPwd=${REVEALER_MONGO_PWD} -e dlcLenderCid=${REVEALER_DLC_LENDER_CID} -e dlcManagerCid=${REVEALER_DLC_MANAGER_CID} -e stacksApi=${REVEALER_STACKS_API} -e bitcoinExplorerUrl=${REVEALER_BITCOIN_EXPLORER_URL} -e mempoolUrl=${REVEALER_MEMPOOL_URL} -e blockCypherUrl=${REVEALER_BLOCK_CYPHER_URL} -e publicAppName=${REVEALER_PUBLIC_APP} -e publicAppVersion=${REVEALER_PUBLIC_APP_VERSION} -e host=${REVEALER_HOST} -e port=${REVEALER_PORT} -e walletPath=${REVEALER_WALLET_PATH} mijoco/uasu_api
```

Overrides:

```bash
export REVEALER_MONGO_USER=staguasu1
export REVEALER_MONGO_PWD=vvDRivVCiuZd88SK
export REVEALER_MONGO_URL=cluster0.ovgne2s.mongodb.net
export REVEALER_MONGO_DBNAME=uasu-db-stag
export REVEALER_BTC_NODE=127.0.0.1:18332
export REVEALER_BTC_RPC_USER=bob
export REVEALER_BTC_RPC_PWD=theraininspainstaysmainlyintheplain
export REVEALER_BTC_SCHNORR_KEY_REVEAL=8854e0f3b4979edc55330722626ce4e12f67ef89f0ac00032d18e6da3a2dc60b
export REVEALER_BTC_SCHNORR_KEY_RECLAIM=1eba17807c82b0aa676b85839ea84663ceb6fbbfb3e0a23a2bdae9cd3df096cb
export REVEALER_BTC_SCHNORR_KEY_ORACLE=8181ea91f5f8e9273dc333e04abefa06ac942d85a4081684ccf3534884a66f8c
export REVEALER_HOST=http://localhost
export REVEALER_PORT=5010
export REVEALER_WALLET_PATH=
export REVEALER_STACKS_API=http://45.79.130.153:3999
export REVEALER_BITCOIN_EXPLORER_URL=http://45.79.130.153:8083
export REVEALER_MEMPOOL_URL=http://45.79.130.153:8083/api
export REVEALER_BLOCK_CYPHER_URL=http://45.79.130.153:8083/api
export REVEALER_PUBLIC_APP_NAME="REVEALER Devenv API"
export REVEALER_PUBLIC_APP_VERSION=1.0.0
```
