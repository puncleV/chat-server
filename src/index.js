const Server = require('./server')
const Api = require('./database/api')
const logger = require('./logger')

const MongoClient = require('mongodb').MongoClient

const {
  appSecrets,
  server: serverConfig,
  session: sessionConfig,
  mongo: mongoConfig
} = require('../config')

const killMongoConnection = (client) => {
  client.close(function () {
    logger.info('mongo connection closed')

    process.exit(0)
  })
}

const main = async () => {
  const client = await MongoClient.connect(mongoConfig.url, {useNewUrlParser: true})
  const db = await client.db(mongoConfig.db)
  const api = new Api(db)

  process
    .on('SIGINT', killMongoConnection.bind(this, client))
    .on('SIGTERM', killMongoConnection.bind(this, client))

  const server = new Server({
    appSecrets,
    serverConfig,
    sessionConfig
  })

  server.start(api)
}

main()
