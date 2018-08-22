const winston = require('winston')

const production = process.env.NODE_ENV === 'production'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'chat.log' })
  ]
})

if (!production) {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple()
    })
  )
}

const getLogLevel = (status) => {
  if (status >= 500) {
    return 'error'
  }

  if (status >= 400) {
    return 'warn'
  }

  if (status >= 100) {
    return 'info'
  }
}

/**
 * Logger function
 * @param {object} ctx koa context
 * @param {function} next next step
 */
const middleware = async (ctx, next) => {
  const begin = Date.now()

  await next()

  if (ctx.method !== 'OPTIONS') {
    const timeSpent = Date.now() - begin
    const logLevel = getLogLevel(ctx.status)

    logger.log(
      logLevel,
      `[${new Date().toISOString()}] ${ctx.method} ${ctx.originalUrl} ${ctx.status} ${timeSpent}ms`
    )
  }
}

module.exports = middleware
