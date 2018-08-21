const Router = require('koa-router')

const { baseApiRoute } = require('../../config')
const ResponseHelper = require('../helpers/response-helper')
const { usernameMaxLength } = require('../../config')

const router = new Router()

router.post(`${baseApiRoute}/login`, async ctx => {
  const username = ctx.request.body.username

  if (typeof username !== 'string' || username.length === 0) {
    return ResponseHelper.error(ctx, 400, 'wrong username')
  }

  if (username.length > usernameMaxLength) {
    return ResponseHelper.error(ctx, 400, 'wrong username length')
  }

  ctx.cookies.set('username', username)

  ctx.body = {
    status: 'success',
    message: 'successful login'
  }
})

module.exports = router
