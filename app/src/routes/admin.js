const assert = require('assert')
const express = require('express')
const router = express.Router()
const { db } = require('../db')
const { MOVE_FUNDS_PASS } = require('../config')

const VALID_ORDER_STATUS = ['waiting', 'successful', 'expired', 'overpaid', 'underpaid', 'cleared']

// POST - /admin/clear-order
router.route('/clear-order').post(async (req, res, next) => {
  try {
    console.log('got /clear-order request:', { body: req.body })

    const { wallet } = req
    const { orderId, password, newStatus } = req.body

    assert.ok(typeof orderId === 'number', 'Expected number: orderId')
    const order = await db.getOrderById({ childId: orderId })
    assert.ok(order, `Cannot find order with id ${orderId}`)
    assert.ok(typeof password === 'string', 'Missing password')
    assert.ok(password === MOVE_FUNDS_PASS, 'Wrong password')
    if (newStatus) assert.ok(VALID_ORDER_STATUS.includes(newStatus), `Invalid status, choose one between: ${VALID_ORDER_STATUS.join('|')}`)
    const status = newStatus || 'cleared'

    // check balance
    const address = wallet.getAddressFromChildIndex(Number(orderId))
    wallet.throwOnInvalidAddress(address)
    const balance = await wallet.getErc20Balance(address)
    assert.ok(balance, 'Address has no balance')

    // move funds
    const privateKey = wallet.getPrivateKeyFromChildIndex(Number(orderId))
    const txs = await wallet.transferAllToColdWallet({ privateKey })
    console.log('moved funds:', txs)

    // update status on DB
    const outcome = await db.addOrUpdateOrder({ ...order, status })
    console.log('clear order outcome:', outcome)

    if (outcome) {
      // return obj...
      res.status(200).json({ status, orderId, message: 'Order cleared' })
    } else res.status(200).json({ status: 'error', error: 'Error clearing order' })
    res.end()
  } catch (err) {
    next(err)
  }
})

// POST - /admin/faucet
router.route('/faucet').post(async (req, res, next) => {
  try {
    console.log('got /faucet request:', { body: req.body })

    const { wallet } = req
    const { address, amount, password } = req.body

    assert.ok(typeof address === 'string', 'Expected string: address')
    wallet.throwOnInvalidAddress(address)
    assert.ok(typeof amount === 'string', 'Expected string: amount')
    assert.ok(typeof password === 'string', 'Missing password')
    assert.ok(password === MOVE_FUNDS_PASS, 'Wrong password')

    // check Hot Wallet ERC20 balance
    const hotWalletAddress = await wallet.getHotWalletAddress()
    const balance = await wallet.getErc20Balance(hotWalletAddress)
    assert.ok(balance, 'Hot Wallet has not enough ERC20 balance')
    if (balance < BigInt(amount)) throw new Error(`Hot Wallet balance is ${balance}, which is lower than ${amount}`)

    // send funds
    const privateKey = wallet.getHotWalletPrivateKey()
    const tx = await wallet.sendErc20Transaction({ privateKey, to: address, amount })
    console.log('faucet - sent funds:', tx)

    if (tx.hash) {
      // return obj...
      res.status(200).json({ status: 'success', txId: tx.hash, message: 'amount sent' })
    } else res.status(200).json({ status: 'error', error: 'Error Sending funds - check logs' })
    res.end()
  } catch (err) {
    next(err)
  }
})

module.exports = router
