const socket = require('socket.io')
const http = require('http')

class Socket {
  /**
   * @param {object} server http server
   * @param {Koa} app koa app
   */
  constructor (server, app) {
    this.io = socket(server)

    this.io.use((socket, next) => {
      let error = null

      try {
        // create a new (fake) Koa context to decrypt the session cookie
        let ctx = app.createContext(socket.request, new http.OutgoingMessage())
        socket.session = ctx.session
      } catch (err) {
        error = err
      }

      return next(error)
    })

    this.io.use(Socket.authCheck)
    this.io.on('connection', this.onConnection.bind(this))
    // this.io.on('create-room', this.onConnection.bind(this))
    // this.io.on('join-room', this.onConnection.bind(this))
    // this.io.on('send-message', this.onConnection.bind(this))
  }

  static authCheck (socket, next) {
    if (typeof socket.session.username === 'string' && socket.session.username.length) {
      next()
    } else {
      throw new Error('not authorized')
    }
  }

  /**
   * set socket's logger
   * @param {object} logger Winston instance
   */
  setLogger (logger) {
    this.logger = logger
  }

  onConnection (socket) {
    this.logger.info(`${socket.session.username} connected`)
    socket.on('disconnect', this.onDisconnect.bind(this))
  }

  onDisconnect (socket) {
    this.logger.info(`${socket.session.username} disconnected`)
  }
}

module.exports = Socket
