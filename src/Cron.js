const { RPC_URL, CHECK_INTERVAL } = require('./config')

class CronJob {
  constructor({ wallet, db }) {
    this.wallet = wallet
    this.db = db
  }

  async start() {
    this.timer = setInterval(async () => {
      await this.checkOrders()
    }, CHECK_INTERVAL)
  }

  async stop() {
    clearInterval(this.timer)
  }

  async checkOrders() {

    await this.checkWaitingOrders()
    await this.checkExpiredOrders()

  }

  async checkWaitingOrders() {
    /*
     1. get array of all the waiting orders (that are not expired): this.db.getWaitingOrders
     2. query the chain for all the orders, check if the deposit address has the expected balance
     3. if it does, send the amount to the COLD_WALLET_ADDRESS, otherwise skip
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
