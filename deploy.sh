#!/bin/bash -e
#
############################################################

export DEPLOYMENT=$1
export PORT=22
export SERVER=leibniz.brightblock.org
export DOCKER_NAME=revealer_api_staging
export TARGET_ENV=linode-staging
if [ "$DEPLOYMENT" == "prod" ]; then
  SERVER=spinoza.brightblock.org
  DOCKER_NAME=revealer_api_production
  TARGET_ENV=linode-production
elif [ "$DEPLOYMENT" == "devnet" ]; then
  SERVER=rawls.brightblock.org
  DOCKER_NAME=revealer_api_staging
  TARGET_ENV=linode-staging
fi
export DOCKER_ID_USER='mijoco'
export DOCKER_CMD='docker'

printf "\n==================================="
printf "\nBuilding image: mijoco/revealer_api."
printf "\nConnecting to: $SERVER on ssh port $PORT"
printf "\nDeploying container: $DOCKER_NAME."
printf "\nDeploying target: $TARGET_ENV."
printf "\n\n"

$DOCKER_CMD build -t mijoco/revealer_api .
$DOCKER_CMD tag mijoco/revealer_api mijoco/revealer_api
$DOCKER_CMD push mijoco/revealer_api:latest

  ssh -i ~/.ssh/id_rsa -p $PORT bob@$SERVER "
    cd /home/bob/hubgit/revealer-api
    pwd
    cat .env;
    docker login;
    docker pull mijoco/revealer_api;

    docker rm -f ${DOCKER_NAME}
    source /home/bob/.profile;
    docker run -d -t -i --network host --name ${DOCKER_NAME} -p 4010:4010 -e TARGET_ENV='linode-production' -e btcRpcUser=${REVEALER_BTC_RPC_USER} -e btcRpcPwd=${REVEALER_BTC_RPC_PWD} -e btcNode=${REVEALER_BTC_NODE} -e mongoDbUrl=${REVEALER_MONGO_URL} -e mongoDbName=${REVEALER_MONGO_DBNAME} -e mongoUser=${REVEALER_MONGO_USER} -e mongoPwd=${REVEALER_MONGO_PWD} -e sbtcContractId=${REVEALER_SBTC_CONTRACT_ID} -e poxContractId=${POX_CONTRACT_ID} -e stacksApi=${REVEALER_STACKS_API} -e bitcoinExplorerUrl=${REVEALER_BITCOIN_EXPLORER_URL} -e mempoolUrl=${REVEALER_MEMPOOL_URL} -e blockCypherUrl=${REVEALER_BLOCK_CYPHER_URL} -e publicAppName=${REVEALER_PUBLIC_APP} -e publicAppVersion=${REVEALER_PUBLIC_APP_VERSION} -e host=${REVEALER_HOST} -e port=${REVEALER_PORT} -e walletPath=${REVEALER_WALLET_PATH} mijoco/revealer_api
  ";

printf "Finished....\n"
printf "\n-----------------------------------------------------------------------------------------------------\n";

exit 0;

