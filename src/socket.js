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

    this.io.on('connection', this.onConnection.bind(this))
  }

  onConnection (data) {
    console.log(data)
  }
}

module.exports = Socket
