const express = require('express')
const order = require('./order.js')
const admin = require('./admin.js')

const router = express.Router()

/**
 * App Routes
 */
router.get('/status', (req, res) => res.send('OK'))
router.use('/order', order)
router.use('/admin', admin)
router.use((err, req, res, next) => {
  // logic
  res.status(400).json(err.message)
})

module.exports = router
