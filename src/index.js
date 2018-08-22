const Server = require('./server')
const {
  appSecrets,
  server: serverConfig,
  session: sessionConfig,
  mongo: mongoConfig
} = require('../config')

const server = new Server({
  appSecrets,
  serverConfig,
  sessionConfig,
  mongoConfig
})

server.initialize()
