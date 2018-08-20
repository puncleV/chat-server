const Router = require('koa-router')
const router = new Router()

router.get('/api/', async ctx => {
  ctx.body = {
    message: 'hi'
  }
})

module.exports = router
