const Koa = require('koa')
const BodyParser = require('koa-bodyparser')
const session = require('koa-session')
const { server: serverConfig } = require('../config')
const router = require('./routes/index')

const app = new Koa()
app.keys = ['chat.secret']

const CONFIG = {
  key: 'chat:sess',
  maxAge: 86400000,
  overwrite: true, /** (boolean) can overwrite or not (default true) */
  httpOnly: true, /** (boolean) httpOnly or not (default true) */
  signed: true, /** (boolean) signed or not (default true) */
  rolling: false, /** (boolean) Force a session identifier cookie to be set on every response. The expiration is reset to the original maxAge, resetting the expiration countdown. (default is false) */
  renew: false /** (boolean) renew session when session is nearly expired, so we can always keep user logged in. (default is false) */
}

app.use(session(CONFIG, app))
app.use(BodyParser())
app.use(router.routes())

const server = app.listen(serverConfig.port, () => {
  console.log(`Server listening on port: ${serverConfig.port}`)
})

module.exports = server
