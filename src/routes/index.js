const Router = require('koa-router')
const router = new Router()
const { baseApiRoute } = require('../../config')
const ResponseHelper = require('../helpers/response-helper')

router.post(`${baseApiRoute}/login`, async ctx => {
  const username = ctx.request.body.username

  if (typeof username !== 'string' || username.length === 0) {
    return ResponseHelper.error(ctx, 400, 'wrong username')
  }

  ctx.cookies.set('username', username)

  ctx.body = {
    status: 'success',
    message: 'successful login'
  }
})

module.exports = router
