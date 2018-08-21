const Router = require('koa-router')

const { baseApiRoute } = require('../../config')
const ResponseHelper = require('../helpers/response-helper')
const { usernameMaxLength } = require('../../config')

const router = new Router()

router.post(`${baseApiRoute}/login`, async ctx => {
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

router.get(`${baseApiRoute}/checkLogin`, async ctx => {
  if (void 0 !== ctx.session.username) {
    ctx.body = {
      status: 'success'
    }
  } else {
    return ResponseHelper.error(ctx, 401, 'not authenticated')
  }
})

router.get(`${baseApiRoute}/logout`, async ctx => {
  ctx.session = null

  ctx.body = {
    status: 'success'
  }
})
module.exports = router
