const Server = require('./server')
const Api = require('./database/api')

const MongoClient = require('mongodb').MongoClient

const {
  appSecrets,
  server: serverConfig,
  session: sessionConfig,
  mongo: mongoConfig
} = require('../config')

const main = async () => {
  const client = await MongoClient.connect(mongoConfig.url, {useNewUrlParser: true})
  const db = await client.db(mongoConfig.db)
  const api = new Api(db)

  const server = new Server({
    appSecrets,
    serverConfig,
    sessionConfig
  })

  server.start(api)
}

main()
