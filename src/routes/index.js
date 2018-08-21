const Router = require('koa-router')
const router = new Router()

  ctx.cookies.set('username', username)

  ctx.body = {
    status: 'success',
    message: 'successful login'
  }
})

module.exports = router
