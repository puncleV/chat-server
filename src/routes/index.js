const Router = require('koa-router')

const ResponseHelper = require('../helpers/response-helper')
const { baseApiRoute } = require('../../config')
const { usernameMaxLength } = require('../../config')

const router = new Router()
const baseRoute = new Router()

router.post(`/login`, async ctx => {
  const username = ctx.request.body.username

  ctx.body = {
    status: 'success'
  }

  if (typeof username !== 'string' || username.length === 0) {
    return ResponseHelper.error(ctx, 400, 'wrong username')
  }

  if (username.length > usernameMaxLength) {
    return ResponseHelper.error(ctx, 400, 'wrong username length')
  }

  if (ctx.session.username === username) {
    return
  }

  ctx.session.username = username
})

router.get(`/checkLogin`, async ctx => {
  if (void 0 !== ctx.session.username) {
    ctx.body = {
      status: 'success'
    }
  } else {
    return ResponseHelper.error(ctx, 401, 'not authenticated')
  }
})

router.get(`/logout`, async ctx => {
  ctx.session = null

  ctx.body = {
    status: 'success'
  }
})

baseRoute.use(baseApiRoute, router.routes(), router.allowedMethods())

module.exports = baseRoute
