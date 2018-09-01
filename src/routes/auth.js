const Router = require('koa-router')

const logger = require('../logger')
const { auth: {usernameMaxLength, baseRoute} } = require('../../config')
const router = new Router()
const authRouter = new Router()
/**
 * Fill up ctx fields with error statuses
 * @param {object} ctx koa context
 * @param {object} ctx.response koa response
 * @param {object} ctx.body koa body
 * @param {number} status response status code
 * @param {string} message response message
 */
const error = (ctx, status, message) => {
  ctx.response.status = status
  ctx.body = {
    status: 'error',
    message
  }

  return ctx
}

router.post(`/login`, async ctx => {
  const username = ctx.request.body.username

  ctx.body = {
    status: 'success'
  }

  if (typeof username !== 'string' || username.length === 0) {
    return error(ctx, 400, 'wrong username')
  }

  if (username.length > usernameMaxLength) {
    return error(ctx, 400, 'wrong username length')
  }

  if (ctx.session.username === username) {
    return
  } else if (typeof ctx.session.username === 'string') {
    return error(ctx, 403, 'access forbidden')
  }

  try {
    await ctx.app.api.get('user').addOrUpdateUser(username)
    ctx.session.username = username
  } catch (e) {
    logger.error(`login | ${e.message}`)
    return error(ctx, 500, 'server error')
  }
})

router.get(`/checkLogin`, async ctx => {
  if (void 0 !== ctx.session.username) {
    ctx.body = {
      status: 'success'
    }
  } else {
    return error(ctx, 401, 'unauthorized')
  }
})

router.get(`/logout`, async ctx => {
  if (typeof ctx.session.username !== 'string') {
    return error(ctx, 401, 'unauthorized')
  }

  try {
    await ctx.app.api.get('user').setOnlineByUsername(ctx.session.username, false)
  } catch (e) {
    logger.error(`logout | ${e.message}`)
    return error(ctx, 500, 'server error')
  }

  ctx.session = null

  ctx.body = {
    status: 'success'
  }
})

authRouter.use(baseRoute, router.routes(), router.allowedMethods())

module.exports = authRouter
