import { ConfigI } from "../types/loans";

let CONFIG= {} as ConfigI;

const LOCAL_REGTEST_CONFIG = {
  // api running n develop mode on localhost against local regetest
  mongoDbUrl: 'cluster0.ovgne2s.mongodb.net',
  mongoDbName: 'uasu-db-dev',
  mongoUser: 'devuasu1',
  mongoPwd: 'FTNM7QpjqMHph4k7',
  btcNode: '127.0.0.1:18332',
  btcRpcUser: 'devnet',
  btcRpcPwd: 'devnet',
  host: 'http://localhost',
  port: 5010,
  walletPath: '/wallet/descwallet',
  network: 'devnet',
  sbtcContractId: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.asset-3',
  dlcLenderCid: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.uasu-sbtc-loan-v2',
  dlcManagerCid: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.dlc-manager-v1-1',
  stacksApi: 'http://localhost:3999',
  stacksExplorerUrl: 'http://127.0.0.1:3020',
  bitcoinExplorerUrl: 'https://mempool.space/testnet/api',
  mempoolUrl: 'https://mempool.space/testnet/api',
  blockCypherUrl: 'https://api.blockcypher.com/v1/btc/test3',
  btcSchnorrReveal: 'd796ea3dd9d6cc91dac7ae254b111099acc7b640ce98b74c83975d26b7f49804',
  btcSchnorrReclaim: 'f32a129e799bacde2d451569e56598cdc56f83e0e8708303cc72d5852990b7d8',
  btcSchnorrOracle: 'f0e8dfde982fb06e26739502d92cdf433cc40036e120df45259fe590a3f043e3',
  publicAppName: 'UASU Staging API',
  publicAppVersion: '1.0.0',
  mailChimpApiKey: '9f34bc871c6ea31c75810ca57da1e40e-us10',
  mailChimpAudience: 'cf9d92c7db',
}

const LOCAL_TESTNET_CONFIG = {
  // api running n develop mode on localhost against local testnet
  mongoDbUrl: 'cluster0.ovgne2s.mongodb.net',
  mongoDbName: 'uasu-db-stag',
  mongoUser: 'staguasu1',
  mongoPwd: 'vvDRivVCiuZd88SK',
  btcNode: '127.0.0.1:18332',
  btcRpcUser: 'devnet',
  btcRpcPwd: 'devnet',
  btcSchnorrReveal: '8854e0f3b4979edc55330722626ce4e12f67ef89f0ac00032d18e6da3a2dc60b',
  btcSchnorrReclaim: '1eba17807c82b0aa676b85839ea84663ceb6fbbfb3e0a23a2bdae9cd3df096cb',
  btcSchnorrOracle: '8181ea91f5f8e9273dc333e04abefa06ac942d85a4081684ccf3534884a66f8c',
  host: 'http://localhost',
  port: 5010,
  walletPath: '/wallet/descwallet',
  network: 'testnet',
  sbtcContractId: 'ST1R1061ZT6KPJXQ7PAXPFB6ZAZ6ZWW28G8HXK9G5.asset-3',
  dlcLenderCid: 'ST1R1061ZT6KPJXQ7PAXPFB6ZAZ6ZWW28G8HXK9G5.uasu-sbtc-loan-v2',
  dlcManagerCid: 'ST1JHQ5GPQT249ZWG6V4AWETQW5DYA5RHJB0JSMQ3.dlc-manager-v1-1',
  stacksApi: 'https://api.testnet.hiro.so',
  stacksExplorerUrl: 'https://explorer.hiro.so/',
  bitcoinExplorerUrl: 'https://mempool.space/testnet/api',
  mempoolUrl: 'https://mempool.space/testnet/api',
  blockCypherUrl: 'https://api.blockcypher.com/v1/btc/test3',
  publicAppName: 'UASU Staging API',
  publicAppVersion: '1.0.0',
  mailChimpApiKey: '9f34bc871c6ea31c75810ca57da1e40e-us10',
  mailChimpAudience: 'cf9d92c7db',
}

const LOCAL_DEVENV_CONFIG = {
  // api running n develop mode on localhost against local devenv
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
  port: 5010,
  walletPath: '',
  network: 'testnet',
  sbtcContractId: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.asset',
  dlcLenderCid: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.uasu-sbtc-loan-v2',
  dlcManagerCid: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.dlc-manager-v1-1',
  //stacksApi: 'https://api.testnet.hiro.so',
  stacksApi: 'http://45.79.130.153:3999',
  stacksExplorerUrl: 'http://127.0.0.1:3020',
  bitcoinExplorerUrl: 'http://45.79.130.153:8083',
  mempoolUrl: 'http://45.79.130.153:8083/api',
  blockCypherUrl: 'http://45.79.130.153:8083/api',
  publicAppName: 'UASU Devenv API',
  publicAppVersion: '1.0.0',
  mailChimpApiKey: '9f34bc871c6ea31c75810ca57da1e40e-us10',
  mailChimpAudience: 'cf9d92c7db',
} as ConfigI

export function setConfigOnStart() {
	if (isLocalTestnet()) CONFIG = LOCAL_TESTNET_CONFIG;
	else if (isLocalRegtest()) CONFIG = LOCAL_REGTEST_CONFIG;
	else if (isLocalDevenv()) CONFIG = LOCAL_DEVENV_CONFIG;
  setOverrides();
}

export function printConfig() {
  console.log('== ' + process.env.NODE_ENV + ' ==========================================================')
  console.log('CONFIG.mongoDbName = ' + CONFIG.mongoDbName)
  console.log('CONFIG.mongoUser = ' + CONFIG.mongoUser)
  console.log('CONFIG.mongoPwd = ' + CONFIG.mongoPwd.substring(0,2))
  console.log('CONFIG.btcNode = ' + CONFIG.btcNode)
  console.log('CONFIG.btcRpcUser = ' + CONFIG.btcRpcUser)
  console.log('CONFIG.btcSchnorrReveal = ' + CONFIG.btcSchnorrReveal.substring(0,2))
  console.log('CONFIG.btcSchnorrReveal = ' + CONFIG.btcSchnorrReveal.substring(CONFIG.btcSchnorrReveal.length-3,CONFIG.btcSchnorrReveal.length))
  console.log('CONFIG.btcSchnorrReveal = ' + CONFIG.btcSchnorrReveal.substring(CONFIG.btcSchnorrReveal.length-3,CONFIG.btcSchnorrReveal.length))
  console.log('CONFIG.btcSchnorrReclaim = ' + CONFIG.btcSchnorrReclaim.substring(0,2))
  console.log('CONFIG.btcSchnorrReclaim = ' + CONFIG.btcSchnorrReclaim.substring(CONFIG.btcSchnorrReveal.length-3,CONFIG.btcSchnorrReveal.length))
  console.log('CONFIG.btcSchnorrOracle = ' + CONFIG.btcSchnorrOracle.substring(CONFIG.btcSchnorrOracle.length-3,CONFIG.btcSchnorrReveal.length))
  console.log('CONFIG.host = ' + CONFIG.host)
  console.log('CONFIG.port = ' + CONFIG.port)
  console.log('CONFIG.walletPath = ' + CONFIG.walletPath)
  console.log('CONFIG.sbtcContractId = ' + CONFIG.sbtcContractId)
  console.log('CONFIG.dlcLenderCid = ' + CONFIG.dlcLenderCid)
  console.log('CONFIG.dlcManagerCid = ' + CONFIG.dlcManagerCid)
  console.log('CONFIG.stacksApi = ' + CONFIG.stacksApi)
  console.log('CONFIG.bitcoinExplorerUrl = ' + CONFIG.bitcoinExplorerUrl)
  console.log('CONFIG.mempoolUrl = ' + CONFIG.mempoolUrl)
  console.log('CONFIG.blockCypherUrl = ' + CONFIG.blockCypherUrl)
  console.log('CONFIG.publicAppName = ' + CONFIG.publicAppName)
  console.log('CONFIG.publicAppVersion = ' + CONFIG.publicAppVersion)
}

function setOverrides() {
  if (isLocalDevenv() || isLocalRegtest()) {
    // outside docker : config is provided by the application
    CONFIG.publicAppVersion = '1.0.0';
  } else if (isLocalTestnet()) {
    CONFIG.btcNode = 'localhost:18332'
  } else {
    // inside docker : config is provided by the server
    CONFIG.host = process.env.host || '';
    CONFIG.port = Number(process.env.port) || 5010;
    CONFIG.walletPath = process.env.walletPath || '';
    CONFIG.sbtcContractId = process.env.sbtcContractId || '';
    CONFIG.dlcLenderCid = process.env.dlcLenderCid || '';
    CONFIG.dlcManagerCid = process.env.dlcManagerCid || '';
    CONFIG.stacksApi = process.env.stacksApi || '';
    CONFIG.bitcoinExplorerUrl = process.env.bitcoinExplorerUrl || '';
    CONFIG.mempoolUrl = process.env.mempoolUrl || '';
    CONFIG.blockCypherUrl = process.env.blockCypherUrl || '';
    CONFIG.publicAppName = process.env.publicAppName || '';
    CONFIG.publicAppVersion = process.env.publicAppVersion || '';
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
    CONFIG.mailChimpApiKey = process.env.mailChimpApiKey || '';
    CONFIG.mailChimpAudience = process.env.mailChimpAudience || '';
  }
}

export function isLocalRegtest() {
  const environ = process.env.NODE_ENV;
  return (environ && environ === 'local-regtest')
}

export function isLocalTestnet() {
  const environ = process.env.NODE_ENV;
  return (environ && environ === 'local-testnet')
}

export function isLocalDevenv() {
  const environ = process.env.NODE_ENV;
  return (environ === 'local-devenv')
}

export function isDev() {
  const environ = process.env.NODE_ENV;
  return (!environ || environ === 'test' || environ === 'development' || environ === 'dev')
}

export function isRemoteDevenv() {
  const environ = process.env.NODE_ENV;
  return (environ === 'remote-devenv')
}

export function getConfig() {
  if (!CONFIG || !CONFIG.btcNode) setConfigOnStart();
	return CONFIG;
}
