const assert = require('assert')
const express = require('express')
const router = express.Router()
const { db } = require('../db')
const { DB_CHILD_ID_KEYNAME } = require('../config')

// POST - /order/create
router.route('/create').post(async (req, res, next) => {
  try {
    const { wallet } = req
    const { amount, customer, item, note } = req.body
    console.log('got request', { body: req.body })
    assert.ok(amount, 'Expected valid amount')
    assert.ok(typeof amount === 'string', 'amount must be a string')
    assert.ok(customer, 'Expected customer id')

    /*
      1. create an order using amount, customer and optional item|note args.
      2. get wallet child index +1 (progressive from the DB)
      3. generate a new address with increased index
      4. store reference into the database: { amount, customer, item, note, childId, address, time, status }
      5. return order json { status: 'waiting', amount: '...', address: '...', orderId: childId, time }
    */

    const childId = (await db.getKey(DB_CHILD_ID_KEYNAME, 1)) + 1
    // derive address from childId
    const address = wallet.getAddressFromChildIndex(Number(childId))
    wallet.throwOnInvalidAddress(address)
    const time = Date.now()
    const order = {
      childId,
      address,
      amount,
      customer,
      item,
      note,
      time,
      status: 'waiting'
    }
    const outcome = await db.addOrUpdateOrder(order)
    console.log('creating order outcome:', outcome)
    // increasing child_id
    await db.setKey(DB_CHILD_ID_KEYNAME, childId)

    if (outcome) {
      // return obj...
      res.status(200).json({ status: 'waiting', orderId: childId, address, amount, time })
    } else res.status(200).json({ status: 'error', error: 'Error creating order' })
    res.end()
  } catch (err) {
    next(err)
  }
})

// GET - /order/get/<orderId>  (get order status)
router.route('/get/:orderId').get(async (req, res, next) => {
  try {
    const childId = Number(req.params.orderId)
    const order = await db.getOrderById({ childId })
    res.status(200).json(order)
  } catch (err) {
    next(err)
  }
})

// GET - /order/address/<address>  (get order by address)
router.route('/address/:address').get(async (req, res, next) => {
  try {
    const { wallet } = req
    const address = req.params.address
    wallet.throwOnInvalidAddress(address)

    const order = await db.getOrderByAddress({ address })
    res.status(200).json(order)
  } catch (err) {
    next(err)
  }
})

module.exports = router
