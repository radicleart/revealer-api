import { ConfigI } from "../types/revealer_types.js";

let CONFIG= {} as ConfigI;

const DEVNET_CONFIG = {
  publicAppName: 'Revealer API',
  publicAppVersion: '0.0.1',
  btcSchnorrReveal: '8854e0f3b4979edc55330722626ce4e12f67ef89f0ac00032d18e6da3a2dc60b',
  btcSchnorrReclaim: '1eba17807c82b0aa676b85839ea84663ceb6fbbfb3e0a23a2bdae9cd3df096cb',
  btcSchnorrOracle: '8181ea91f5f8e9273dc333e04abefa06ac942d85a4081684ccf3534884a66f8c',
  mongoDbUrl: 'cluster0.ovgne2s.mongodb.net',
  mongoDbName: 'revealer-db-dev',
  mongoUser: 'devuasu1',
  mongoPwd: 'FTNM7QpjqMHph4k7',
  btcRpcUser: 'devnet',
  btcRpcPwd: 'devnet',
  host: 'http://localhost',
  port: 4010,
  walletPath: '/wallet/descwallet',
  stacksApi: 'https://api.testnet.hiro.so',
  stacksExplorerUrl: 'https://explorer.hiro.so/',
  bitcoinExplorerUrl: 'https://mempool.space/testnet/api',
  sbtcContractId: 'ST1R1061ZT6KPJXQ7PAXPFB6ZAZ6ZWW28G8HXK9G5.asset-3',
	electrumUrl: 'https://devnet-electrs.uasu.finance',
}

const LOCAL_TESTNET_CONFIG = {
  // api running n develop mode on localhost against local testnet
  btcNode: '127.0.0.1:18332',
  network: 'testnet',
  sbtcContractId: 'ST1R1061ZT6KPJXQ7PAXPFB6ZAZ6ZWW28G8HXK9G5.asset-3',
  stacksApi: 'https://api.testnet.hiro.so',
  stacksExplorerUrl: 'https://explorer.hiro.so/',
  bitcoinExplorerUrl: 'https://mempool.space/testnet/api',
  mempoolUrl: 'https://mempool.space/testnet/api',
  blockCypherUrl: 'https://api.blockcypher.com/v1/btc/test3',
}

const REMOTE_DEVNET_CONFIG = {
  btcNode: '127.0.0.1:18332',
  mode: 'local-devnet',
  network: 'devnet',
	mempoolUrl: 'https://devnet-mempool.uasu.finance',
	electrumUrl: 'https://devnet-electrs.uasu.finance',
	blockCypherUrl: 'https://devnet-mempool.uasu.finance',
}

const LOCAL_DEVNET_CONFIG = {
  btcSchnorrReveal: 'd796ea3dd9d6cc91dac7ae254b111099acc7b640ce98b74c83975d26b7f49804',
  btcSchnorrReclaim: 'f32a129e799bacde2d451569e56598cdc56f83e0e8708303cc72d5852990b7d8',
  btcSchnorrOracle: 'f0e8dfde982fb06e26739502d92cdf433cc40036e120df45259fe590a3f043e3',
  btcNode: '45.79.130.153:18433',
  mode: 'remote-devnet',
  network: 'devnet',
	mempoolUrl: 'https://devnet-mempool.uasu.finance',
	electrumUrl: 'https://devnet-electrs.uasu.finance',
	blockCypherUrl: 'https://devnet-mempool.uasu.finance',
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
  console.log('CONFIG.stacksApi = ' + CONFIG.stacksApi)
  console.log('CONFIG.bitcoinExplorerUrl = ' + CONFIG.bitcoinExplorerUrl)
  console.log('CONFIG.mempoolUrl = ' + CONFIG.mempoolUrl)
  console.log('CONFIG.blockCypherUrl = ' + CONFIG.blockCypherUrl)
  console.log('CONFIG.publicAppName = ' + CONFIG.publicAppName)
  console.log('CONFIG.publicAppVersion = ' + CONFIG.publicAppVersion)
}

export function setConfigOnStart() {
  if (isLocalRegtest()) {
    // outside docker : config is provided by the application
    CONFIG = {...DEVNET_CONFIG, ...LOCAL_DEVNET_CONFIG}
  } else if (isRemoteRegtest()) {
    CONFIG = {...DEVNET_CONFIG, ...REMOTE_DEVNET_CONFIG}
  } else if (isLocalTestnet()) {
    CONFIG = {...DEVNET_CONFIG, ...LOCAL_TESTNET_CONFIG}
  } else {
    CONFIG.host = process.env.host || '';
    CONFIG.port = Number(process.env.port) || 5010;
    CONFIG.walletPath = process.env.walletPath || '';
    CONFIG.sbtcContractId = process.env.sbtcContractId || '';
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
  }
}

export function isLocalRegtest() {
  const environ = process.env.NODE_ENV;
  return (environ && environ === 'local-devnet')
}

export function isLocalTestnet() {
  const environ = process.env.NODE_ENV;
  return (environ && environ === 'local-testnet')
}

export function isRemoteRegtest() {
  const environ = process.env.NODE_ENV;
  return (environ && environ === 'remote-devnet')
}

export function getConfig() {
  if (!CONFIG || !CONFIG.btcNode) setConfigOnStart();
	return CONFIG;
}
