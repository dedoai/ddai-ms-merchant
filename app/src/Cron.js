const { RPC_URL, CHECK_INTERVAL, FAUCET_AIRDROP_AMOUNT } = require('./config')

class CronJob {
  constructor({ wallet, db }) {
    this.wallet = wallet
    this.db = db
  }

  async start() {
    this.timer = setInterval(async () => {
      const hasBalance = await this.checkHotWalletBalance()
      if (hasBalance) await this.checkOrders()
    }, CHECK_INTERVAL)
  }

  async stop() {
    clearInterval(this.timer)
  }

  async checkHotWalletBalance() {
    const HOT_WALLET_ADDRESS = await this.wallet.getHotWalletAddress()
    const hotWalletBalance = await this.wallet.getBalance(HOT_WALLET_ADDRESS)
    if (hotWalletBalance <= FAUCET_AIRDROP_AMOUNT) {
      console.error('!!! TOP-UP HOT-WALLET BALANCE !!!\nHot wallet has not enough ETH')
      return false
    }
    return true
  }

  async checkOrders() {

    await this.checkWaitingOrders()
    await this.checkExpiredOrders()

  }

  async checkWaitingOrders() {
    /*
     1. get array of all the waiting orders (that are not expired): this.db.getWaitingOrders
     2. query the chain for all the orders, check if the deposit address has the expected ERC20 balance
     3. if it does, send the ETH Airdrop and have all the balances forwarded to the COLD_WALLET_ADDRESS, otherwise skip
        if the amount is under/above the expected, mark as "overpaid/underpaid".
     4. update the document: this.db.addOrUpdateOrder({ ..., status: 'successful' })
     */

     const orders = await this.db.getWaitingOrders()
     if (!orders.length) return

     console.log(`cron: checking ${orders.length} orders`)
     return Promise.all(orders.map(async (order) => {
       try {
         const address = this.wallet.getAddressFromChildIndex(order.childId)
         const balance = await this.wallet.getErc20Balance(address)
         if (balance === BigInt(order.amount) && order.status === 'waiting') {
           // order paid!
           await this.sendEthForFees(address)
           await this.transferOrderFundsToColdWallet(order.childId)
           // update db: successful
           await this.updateOrderStatus({ order, status: 'successful', received: String(balance) })
         } else if (balance > BigInt(order.amount)) {
            // update db: overpaid
            await this.updateOrderStatus({ order, status: 'overpaid', received: String(balance) })
         } else if (balance !== BigInt(0) && balance < BigInt(order.amount)) {
            // update db: underpaid
            await this.updateOrderStatus({ order, status: 'underpaid', received: String(balance) })
         } else {
          console.log(`cron:checkOrders() - order #${order.childId} still waiting`)
         }

       } catch (err) {
         console.log('cron:checkOrders() order error:', err)
       }
     }))
  }

  async checkExpiredOrders() {
    const expired = await this.db.getNewExpiredOrders()
    if (!expired.length) return

    console.log(`cron: marking ${expired.length} orders as expired`)
    return Promise.all(expired.map(async (order) => {
     try {
       // mark as expired
       await this.updateOrderStatus({ order, status: 'expired' })
     } catch (err) {
       console.log('cron:checkOrders() expired error:', err)
     }
   }))
  }

  async sendEthForFees (address) {
    // check if address has ETH funds already
    const balance = await this.wallet.getBalance(address)
    if (balance >= FAUCET_AIRDROP_AMOUNT) return // it has enough ETH
    // send ETH to the address so we will be able to pay fees to transfer ERC20
    const privateKey = this.wallet.getHotWalletPrivateKey()
    const gasPrice = await this.wallet.getGasPrice()
    const tx = await this.wallet.sendTransaction({ privateKey, to: address, gasPrice, amount: FAUCET_AIRDROP_AMOUNT })
    console.log('cron: airdrop sent', tx.hash)
    return this.wallet.waitForConfirmation(tx.hash)
  }

  async transferOrderFundsToColdWallet (orderId) {
    const privateKey = this.wallet.getPrivateKeyFromChildIndex(Number(orderId))
    const txs = await this.wallet.transferAllToColdWallet({ privateKey })
    console.log('funds transferred to cold wallet:', txs)
    return txs
  }

  async updateOrderStatus({ order, status, received }) {
    received = received || order.received
    const result = await this.db.addOrUpdateOrder({ ...order, status, received })
    console.log(`cron:checkOrders() order ${status} - updated:`, result)
    return result
  }

}

module.exports = CronJob
