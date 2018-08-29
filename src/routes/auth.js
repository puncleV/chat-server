const Router = require('koa-router')

const ResponseHelper = require('../helpers/response-helper')
const { auth: {usernameMaxLength, baseRoute} } = require('../../config')
const router = new Router()
const authRouter = new Router()

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
  } else if (typeof ctx.session.username === 'string') {
    return ResponseHelper.error(ctx, 403, 'access forbidden')
  }

  try {
    const userCollection = await ctx.app.db.collection('users')

    await userCollection.findOneAndUpdate(
      {
        username
      }, {
        $setOnInsert: {
          username,
          currentRoom: ''
        },
        $set: {
          online: true
        }
      }, {
        upsert: true
      }
    )

    ctx.session.username = username
  } catch (e) {
    return ResponseHelper.error(ctx, 500, 'server error')
  }
})

router.get(`/checkLogin`, async ctx => {
  if (void 0 !== ctx.session.username) {
    ctx.body = {
      status: 'success'
    }
  } else {
    return ResponseHelper.error(ctx, 401, 'unauthorized')
  }
})

router.get(`/logout`, async ctx => {
  if (typeof ctx.session.username !== 'string') {
    return ResponseHelper.error(ctx, 401, 'unauthorized')
  }

  try {
    const userCollection = await ctx.app.db.collection('users')

    await userCollection.findOneAndUpdate(
      {
        username: ctx.session.username
      }, {
        $set: {
          currentRoom: '',
          online: false
        }
      }
    )
  } catch (e) {
    return ResponseHelper.error(ctx, 500, 'server error')
  }

  ctx.session = null

  ctx.body = {
    status: 'success'
  }
})

authRouter.use(baseRoute, router.routes(), router.allowedMethods())

module.exports = authRouter
