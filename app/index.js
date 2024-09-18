const assert = require('assert')
const { RPC_URL, SERVER_PORT, COLD_WALLET_ADDRESS, HOT_WALLET_MNEMONIC, FAUCET_AIRDROP_AMOUNT, DB_CHILD_ID_KEYNAME } = require('./config')
const { initDb, db } = require('./db')
const Wallet = require('./Wallet')
const Server = require('./Server')
const CronJob = require('./Cron')
global.fetch = require('node-fetch')

;(async () => {

  // current config data
  console.log(`Using RPC: ${RPC_URL}`)

  // instantiate wallet
  const wallet = new Wallet(HOT_WALLET_MNEMONIC)
  const HOT_WALLET_ADDRESS = await wallet.getHotWalletAddress()
  console.log('Hot wallet initialized, address:', HOT_WALLET_ADDRESS)
  const hotWalletBalance = await wallet.getBalance(HOT_WALLET_ADDRESS)
  console.log('Hot wallet balance:', hotWalletBalance)
  console.log(FAUCET_AIRDROP_AMOUNT)
  assert(hotWalletBalance > FAUCET_AIRDROP_AMOUNT, 'Please top-up hot wallet balance!')
  
  console.log(`Cold wallet address: ${COLD_WALLET_ADDRESS}`)

  // configure & start DB
  await initDb()
  const childId = (await db.getKey(DB_CHILD_ID_KEYNAME, 1))
  console.log('Last order id:', childId)

  // start server
  new Server({ wallet }).listen(SERVER_PORT, () => console.log(`Server listening on port ${SERVER_PORT}`))

  // start cronjob
  console.log('Starting cronjob')
  const cronjob = new CronJob({ wallet, db })
  await cronjob.start()

})()
