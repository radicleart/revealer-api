# revealer-api

Node Server for REVEALER proxy server.

## Swagger API Docs

- [swagger docs](https://revealer.bridge.sbtc.tech/revealer-api/).

## Build

```bash
node -v
v19.7.0

npm install
npm run build
```

### Locally on regtest

See also [API README](https://github.com/radicleart/revealer-api)

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
docker run -d -t -i --network host --name revealer_api_production -p 4010:4010 -e TARGET_ENV='linode-production' -e btcSchnorrReveal=${REVEALER_BTC_SCHNORR_KEY_REVEAL} -e btcSchnorrReclaim=${REVEALER_BTC_SCHNORR_KEY_RECLAIM} -e btcSchnorrOracle=${REVEALER_BTC_SCHNORR_KEY_ORACLE} -e btcRpcUser=${REVEALER_BTC_RPC_USER} -e btcRpcPwd=${REVEALER_BTC_RPC_PWD} -e btcNode=${REVEALER_BTC_NODE} -e mongoDbUrl=${REVEALER_MONGO_URL} -e mongoDbName=${REVEALER_MONGO_DBNAME} -e mongoUser=${REVEALER_MONGO_USER} -e mongoPwd=${REVEALER_MONGO_PWD} mijoco/revealer_api
```

```bash
# stag
docker rm -f revealer_api_staging
docker run -d -t -i --network host --name revealer_api_staging -p 4010:4010 -e TARGET_ENV='linode-staging' -e btcRpcUser=${REVEALER_BTC_RPC_USER} -e btcRpcPwd=${REVEALER_BTC_RPC_PWD} -e btcNode=${REVEALER_BTC_NODE} -e mongoDbUrl=${REVEALER_MONGO_URL} -e mongoDbName=${REVEALER_MONGO_DBNAME} -e mongoUser=${REVEALER_MONGO_USER} -e mongoPwd=${REVEALER_MONGO_PWD} -e dlcLenderCid=${REVEALER_DLC_LENDER_CID} -e dlcManagerCid=${REVEALER_DLC_MANAGER_CID} -e stacksApi=${REVEALER_STACKS_API} -e bitcoinExplorerUrl=${REVEALER_BITCOIN_EXPLORER_URL} -e mempoolUrl=${REVEALER_MEMPOOL_URL} -e blockCypherUrl=${REVEALER_BLOCK_CYPHER_URL} -e publicAppName=${REVEALER_PUBLIC_APP} -e publicAppVersion=${REVEALER_PUBLIC_APP_VERSION} -e host=${REVEALER_HOST} -e port=${REVEALER_PORT} -e walletPath=${REVEALER_WALLET_PATH} mijoco/revealer_api
```

```bash
# stag
docker rm -f revealer_api_devnet
docker run -d -t -i --network host --name revealer_api_devnet -p 4010:4010 -e TARGET_ENV='linode-staging' -e btcRpcUser=${REVEALER_BTC_RPC_USER} -e btcRpcPwd=${REVEALER_BTC_RPC_PWD} -e btcNode=${REVEALER_BTC_NODE} -e mongoDbUrl=${REVEALER_MONGO_URL} -e mongoDbName=${REVEALER_MONGO_DBNAME} -e mongoUser=${REVEALER_MONGO_USER} -e mongoPwd=${REVEALER_MONGO_PWD} -e dlcLenderCid=${REVEALER_DLC_LENDER_CID} -e dlcManagerCid=${REVEALER_DLC_MANAGER_CID} -e stacksApi=${REVEALER_STACKS_API} -e bitcoinExplorerUrl=${REVEALER_BITCOIN_EXPLORER_URL} -e mempoolUrl=${REVEALER_MEMPOOL_URL} -e blockCypherUrl=${REVEALER_BLOCK_CYPHER_URL} -e publicAppName=${REVEALER_PUBLIC_APP} -e publicAppVersion=${REVEALER_PUBLIC_APP_VERSION} -e host=${REVEALER_HOST} -e port=${REVEALER_PORT} -e walletPath=${REVEALER_WALLET_PATH} mijoco/revealer_api
```
