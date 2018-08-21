class ResonseHelpers {
  /**
   * Fill up ctx fields with error statuses
   * @param {object} ctx koa context
   * @param {object} ctx.response koa response
   * @param {object} ctx.body koa body
   * @param {number} status response status code
   * @param {string} message response message
   */
  static error (ctx, status, message) {
    ctx.response.status = status
    ctx.body = {
      status: 'error',
      message
    }

    return ctx
  }
}

module.exports = ResonseHelpers
