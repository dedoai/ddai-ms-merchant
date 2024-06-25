const ms = require('ms')
const fs = require('fs')
const path = require('path')

module.exports = {
  // wallets config
  HOT_WALLET_MNEMONIC: 'prosper tomorrow coil run youth rural pet perfect tornado trend gate cave',
  COLD_WALLET_ADDRESS: '0xE9Cf4e6c8337096Ca76Ece24702aD1EB98639846',
  DEDO_CONTRACT_ADDRESS: '0xbEbd4D5174B1faD2a456863a226d02EcB279102a', // ERC20 Contract address (on Sepolia)
  // server config
  SERVER_PORT: process.env.PORT || 8080,
  RPC_URL: 'https://ethereum-sepolia-rpc.publicnode.com', // Sepolia node RPC url.. to get balance and broadcast tx
  MOVE_FUNDS_PASS: 's3cr3t', // used to force moving stuck orders funds
  // mongodb database
  MONGO_DATABASE_URI: 'mongodb://localhost:27017',
  MONGO_DATABASE_NAME: 'merchant_api',
  DB_CHILD_ID_KEYNAME: 'current_child_id',
  // cronjob
  ORDER_TTL: ms('2 days'), // orders considered expired after x days
  CHECK_INTERVAL: ms('60s'),
  // morgan logs
  logFormat: ':remote-addr :remote-user [:date[clf]] :method :url HTTP/:http-version :status :res[content-length] - :body - :response-time ms',
  accessLogStream: fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' }),
}
