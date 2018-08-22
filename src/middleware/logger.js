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

module.exports = (logger) => {
  /**
   * Logger function
   * @param {object} ctx koa context
   * @param {function} next next step
   */
  return async (ctx, next) => {
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
}
