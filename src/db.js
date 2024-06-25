const { MongoClient } = require('mongodb')
const assert = require('assert')
const { MONGO_DATABASE_URI, MONGO_DATABASE_NAME, ORDER_TTL } = require('./config')

class DedoMerchantDB {
  constructor({ dbUrl, dbName }) {
    this.url = dbUrl
    this.dbName = dbName
    this.client = null
    this.db = null
    this.running = false
  }

  async start() {
    if (!this.running) {
      await this.init()
    }
  }

  async stop() {
    if (this.running && this.client) {
      this.running = false
      await this.client.close()
      this.client = null
      this.db = null
    }
  }

  async init() {
    this.client = new MongoClient(
      this.url,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
      (err) => {
        assert.strictEqual(null, err, 'Error creating mongo client')
      }
    )
    console.log(`connecting to DB`)
    const result = await this.client.connect()
    assert(result, 'Error connecting to DB.')
    this.running = true
    this.db = await this.client.db(this.dbName)
    console.log('connected to DB')

    this.orders = await this.db.collection('orders')
    this.orders.createIndex({ childId: 1 }, { name: 'i_child_id', background: true, unique: true })
    this.orders.createIndex({ time: 1 }, { name: 'i_time', background: true })
    this.orders.createIndex({ address: 1 }, { name: 'i_address', background: true })
    this.orders.createIndex({ customer: 1 }, { name: 'i_customer', background: true })

    this.mem = await this.db.collection('mem')
    this.mem.createIndex({ key: 1 }, { name: 'i_key', background: true, unique: true })
  }

  async getKey(key, defaultValue) {
    const record = await this.mem.findOne({ key })
    return record?.value || defaultValue
  }

  async setKey(key, value) {
    return this.mem.findOneAndUpdate({ key }, { $set: { value } }, { upsert: true })
  }

  async removeKey(key) {
    return this.mem.findOneAndDelete({ key })
  }

  // Add or Update account entry with info
  async addOrUpdateOrder({ childId, address, amount, received = '0', customer, item, time = Date.now(), status = 'waiting', note = '' }) {
    console.log(`called addOrUpdateOrder: ${childId}`)
    return this.orders.findOneAndUpdate(
      { childId },
      {
        $set: {
          childId,
          address,
          amount,
          received,
          customer,
          time,
          status,
          item,
          note,
        }
      },
      { upsert: true }
    )
  }

  // Get order by childId (aka orderId)
  async getOrderById({ childId }) {
    console.log(`called getOrder on orderId: ${childId}`)
    return this.orders.findOne({ childId })
  }

  // Get order by address
  async getOrderByAddress({ address }) {
    console.log(`called getOrderByAddress on address: ${address}`)
    return this.orders.findOne({ address })
  }

  // Check existence of order by address
  async accountExists({ address }) {
    return !!(await this.orders.findOne({ address }))
  }

  // Check existence of order by childId (aka orderId)
  async orderExists({ childId }) {
    return !!(await this.orders.findOne({ childId }))
  }

  // Get n. of orders per customer
  async getOrdersCount({ customer }) {
    const cursor = this.orders.find({ customer })
    return await cursor.count()
  }

  // Get "waiting" orders that have not expired, used by the cron.js
  async getWaitingOrders() {
    const interval = Date.now() - ORDER_TTL
    const orders = await this.orders.find({ status: 'waiting', time: { $gt: interval } }).toArray()
    return orders
  }

    // Get orders to get marked as expired, used by the cron.js
    async getNewExpiredOrders() {
      const interval = Date.now() - ORDER_TTL
      const orders = await this.orders.find({ status: { $eq: 'waiting' }, time: { $lt: interval } }).toArray()
      return orders
    }

}

let db = new DedoMerchantDB({
  dbUrl: MONGO_DATABASE_URI,
  dbName: MONGO_DATABASE_NAME,
})

async function initDb() {
  await db.start()
  return db
}

module.exports = {
  initDb,
  db, // connection instance
}
