const Koa = require('koa')
const MongoClient = require('mongodb').MongoClient
const BodyParser = require('koa-bodyparser')
const session = require('koa-session')
const http = require('http')

const Socket = require('./socket')
const logger = require('./helpers/logger')
const loggerMiddleware = require('./middleware/logger')(logger)
const router = require('./routes/index')
const testing = process.env.NODE_ENV === 'test'

class Server {
  constructor (config = {}) {
    this.config = {
      appSecrets: config.appSecrets,
      server: config.serverConfig,
      session: config.sessionConfig,
      mongo: config.mongoConfig
    }

    this.server = null
    this.socket = null
  }

  async initialize () {
    const app = new Koa()
    app.keys = this.config.appSecrets

    try {
      await this.connectDatabase(app)
    } catch (e) {
      logger.error('can not connect to database:', e.message)
      process.exit(-1)
    }

    app.use(loggerMiddleware)
    app.use(session(this.config.session, app))
    app.use(BodyParser())
    app.use(router.routes())

    this.server = http.Server(app.callback())
    this.socket = new Socket(this.server, app)

    this.server.listen(this.config.server.port, () => {
      if (!testing) {
        logger.info(`server listening on port: ${this.config.server.port}`)
      }
    })
  }

  async connectDatabase (app) {
    const client = await MongoClient.connect(this.config.mongo.url, {useNewUrlParser: true})

    app.db = await client.db(this.config.mongo.db)
  }

  getServer () {
    return this.server
  }
}

module.exports = Server
