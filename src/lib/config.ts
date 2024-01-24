import { ConfigI } from "../types/revealer_types";

let CONFIG= {} as ConfigI;

const REGTEST_REMOTE_CONFIG = {
  mongoDbUrl: 'cluster0.ovgne2s.mongodb.net',
  mongoDbName: 'uasu-db-dev',
  mongoUser: 'devuasu1',
  mongoPwd: 'FTNM7QpjqMHph4k7',
  btcNode: '127.0.0.1:18332',
  btcRpcUser: 'devnet',
  btcRpcPwd: 'devnet',
  btcSchnorrReveal: '8854e0f3b4979edc55330722626ce4e12f67ef89f0ac00032d18e6da3a2dc60b',
  btcSchnorrReclaim: '1eba17807c82b0aa676b85839ea84663ceb6fbbfb3e0a23a2bdae9cd3df096cb',
  btcSchnorrOracle: '8181ea91f5f8e9273dc333e04abefa06ac942d85a4081684ccf3534884a66f8c',
  host: 'http://localhost',
  port: 3012,
  walletPath: '/wallet/descwallet',
  mode: 'regtest-local',
  network: 'devnet',
	mempoolUrl: 'https://devnet-mempool.uasu.finance',
	electrumUrl: 'https://devnet-electrs.uasu.finance',
	blockCypherUrl: 'https://devnet-mempool.uasu.finance',
}

const REGTEST_LOCAL_CONFIG = {
  mongoDbUrl: 'cluster0.ovgne2s.mongodb.net',
  mongoDbName: 'uasu-db-dev',
  mongoUser: 'devuasu1',
  mongoPwd: 'FTNM7QpjqMHph4k7',
  btcNode: '45.79.130.153:18433',
  btcRpcUser: 'devnet',
  btcRpcPwd: 'devnet',
  btcSchnorrReveal: 'd796ea3dd9d6cc91dac7ae254b111099acc7b640ce98b74c83975d26b7f49804',
  btcSchnorrReclaim: 'f32a129e799bacde2d451569e56598cdc56f83e0e8708303cc72d5852990b7d8',
  btcSchnorrOracle: 'f0e8dfde982fb06e26739502d92cdf433cc40036e120df45259fe590a3f043e3',
  host: 'http://localhost',
  port: 3012,
  walletPath: '/wallet/descwallet',
  mode: 'regtest-remote',
  network: 'devnet',
	mempoolUrl: 'https://devnet-mempool.uasu.finance',
	electrumUrl: 'https://devnet-electrs.uasu.finance',
	blockCypherUrl: 'https://devnet-mempool.uasu.finance',
} as ConfigI

export function setConfigOnStart() {
	if (isLocalRegtest()) CONFIG = REGTEST_LOCAL_CONFIG;
	else if (isRemoteRegtest()) CONFIG = REGTEST_REMOTE_CONFIG;
  setOverrides();
}

export function printConfig() {
  console.log('== ' + process.env.NODE_ENV + ' ==========================================================')
  console.log('CONFIG.mongoDbName = ' + CONFIG.mongoDbName)
  console.log('CONFIG.mongoUser = ' + CONFIG.mongoUser)
  console.log('CONFIG.btcNode = ' + CONFIG.btcNode)
  console.log('CONFIG.btcRpcUser = ' + CONFIG.btcRpcUser)
  console.log('CONFIG.host = ' + CONFIG.host)
  console.log('CONFIG.port = ' + CONFIG.port)
}

function setOverrides() {
  if (isLocalRegtest()) {
    // outside docker : config is provided by the application
    CONFIG = REGTEST_LOCAL_CONFIG
  } else if (isRemoteRegtest()) {
    CONFIG = REGTEST_REMOTE_CONFIG
  } else {
    CONFIG.mongoDbUrl = process.env.mongoDbUrl || '';
    CONFIG.mongoDbName = process.env.mongoDbName || '';
    CONFIG.mongoUser = process.env.mongoUser || ''
    CONFIG.mongoPwd = process.env.mongoPwd || ''
    CONFIG.btcNode = process.env.btcNode || '';
    CONFIG.btcRpcUser = process.env.btcRpcUser || '';
    CONFIG.btcRpcPwd = process.env.btcRpcPwd || '';
    CONFIG.btcSchnorrReveal = process.env.btcSchnorrReveal || '';
    CONFIG.btcSchnorrReclaim = process.env.btcSchnorrReclaim || '';
    CONFIG.btcSchnorrOracle = process.env.btcSchnorrOracle || '';
    CONFIG.host = process.env.host || '';
    CONFIG.port = Number(process.env.port) || 5010;
  }
}

export function isLocalRegtest() {
  const environ = process.env.NODE_ENV;
  return (environ && environ === 'regtest-local')
}

export function isRemoteRegtest() {
  const environ = process.env.NODE_ENV;
  return (environ && environ === 'regtest-remote')
}

export function getConfig() {
  if (!CONFIG || !CONFIG.btcNode) setConfigOnStart();
	return CONFIG;
}
