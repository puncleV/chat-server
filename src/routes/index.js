const Router = require('koa-router')

const { baseApiRoute } = require('../../config')
const authRouter = require('./auth')
const baseRouter = new Router()

baseRouter.use(baseApiRoute, authRouter.routes(), authRouter.allowedMethods())

module.exports = baseRouter
