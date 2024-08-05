const ms = require('ms')
const express = require('express')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const cors = require('cors')
const { logFormat, accessLogStream } = require('./config')
const routes = require('./routes')

class Server {
  constructor({ wallet }) {
    const app = express()

    // request logging. dev: console | production: file
    morgan.token('body', (req, res) => JSON.stringify(req.body))
    app.use(morgan(logFormat, { stream: accessLogStream }))
    
    // parse body params and attach them to req.body
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: true }))
    
    // enable CORS - Cross Origin Resource Sharing
    app.use(cors())
    
    // mount api routes
    app.use((req, res, next) => {
      // inject wallet instance to the routes
      req.wallet = wallet
      next()
    })
    app.use(routes)
    
    // catch 404 and forward to error handler
    app.use(notFoundError)

    return app
  }
}

function notFoundError(req, res, next) {
  res.status(404)

  // respond with html page
  if (req.accepts('html')) {
    res.send('<h1>Not found</h1>')
    return;
  }

  // respond with json
  if (req.accepts('json')) {
    res.json({ error: 'Not found' })
    return;
  }

  // default to plain-text. send()
  res.type('txt').send('Not found')
}

module.exports = Server