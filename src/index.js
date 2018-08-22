const Koa = require('koa')
const BodyParser = require('koa-bodyparser')
const session = require('koa-session')
const logger = require('./middleware/logger')
const {
  appSecrets,
  server: serverConfig,
  session: sessionConfig
} = require('../config')
const router = require('./routes/index')
const app = new Koa()

app.keys = appSecrets

app.use(logger)
app.use(session(sessionConfig, app))
app.use(BodyParser())
app.use(router.routes())

const server = app.listen(serverConfig.port, () => {
  console.log(`Server listening on port: ${serverConfig.port}`)
})

module.exports = server
