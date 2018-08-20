const Koa = require('koa')
const { server: serverConfig } = require('../config')
const BodyParser = require('koa-bodyparser')
const router = require('./routes/index')

const app = new Koa()

app.use(router.routes())
app.use(BodyParser())

const server = app.listen(serverConfig.port, () => {
  console.log(`Server listening on port: ${serverConfig.port}`)
})

module.exports = server
