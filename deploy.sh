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
    docker run -d -t -i --name ${DOCKER_NAME} -p 4010:4010 \
      -e TARGET_ENV=${TARGET_ENV} \
      -e mongoDbUrl=${UASU_MONGO_SBTC_URL} \
      -e mongoDbName=revealer1 \
      -e mongoUser=${UASU_MONGO_SBTC_USER} \
      -e mongoPwd=${UASU_MONGO_SBTC_PWD} \
      -e btcNode=${UASU_BTC_NODE} \
      -e btcRpcUser=${UASU_BTC_RPC_USER} \
      -e btcRpcPwd=${UASU_BTC_RPC_PWD} \
      -e btcSchnorrReveal=${UASU_BTC_SCHNORR_KEY_REVEAL} \
      -e btcSchnorrReclaim=${UASU_BTC_SCHNORR_KEY_RECLAIM} \
      -e btcSchnorrOracle=${UASU_BTC_SCHNORR_KEY_ORACLE} \
      mijoco/revealer_api
  ";

printf "Finished....\n"
printf "\n-----------------------------------------------------------------------------------------------------\n";

exit 0;

