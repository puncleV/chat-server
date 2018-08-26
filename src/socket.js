const socket = require('socket.io')
const http = require('http')
const crypto = require('crypto')

/**
 * Client events:
 * 'rooms' - send rooms list to new client
 * 'create room success' - send success to room create with room's hash
 * 'create room error' - send room error with message to client
 * Client broadcasts:
 * 'new room' - send new room info for all but creator if room is public
 */
class Socket {
  /**
   * @param {object} server http server
   * @param {Koa} app koa app
   */
  constructor (server, app) {
    this.app = app
    this.io = socket(server)

    this.io.use(this.addContext.bind(this))
    this.io.use(Socket.authCheck)

    this.io.on('connection', this.onConnection.bind(this))
  }

  static authCheck (socket, next) {
    if (socket.session && typeof socket.session.username === 'string' && socket.session.username.length) {
      next()
    } else {
      socket.disconnect()
    }
  }

  addContext (socket, next) {
    let error = null

    try {
      // create a new (fake) Koa context to decrypt the session cookie
      let ctx = this.app.createContext(socket.request, new http.OutgoingMessage())
      socket.session = ctx.session
    } catch (err) {
      error = err
      this.logger.error(err)
    }

    return next(error)
  }
  /**
   * set socket's logger
   * @param {object} logger Winston instance
   */
  setLogger (logger) {
    this.logger = logger
  }

  async onConnection (socket) {
    this.logger.info(`${socket.session.username} connection`)

    await this.sendRooms(socket)

    socket.on('create room', this.onCreateRoom.bind(this, socket, socket.session.username))
    socket.on('disconnect', this.onDisconnect.bind(this, socket, socket.session.username))
  }

  /**
   * create room handler
   * @param {Socket} socket - clients socket
   * @param {string} username
   * @param {string} roomName
   * @param {RoomType} type
   * @return {Promise<void>}
   */
  async onCreateRoom (socket, username, roomName, type) {
    if (
      typeof roomName === 'string' && roomName.length &&
      typeof type === 'number' && (type === 0 || type === 1)
    ) {
      this.logger.info(`${username} creating room ${roomName}`)

      await this.createRoom(socket, username, roomName, type)
    }
  }

  onDisconnect (socket, username) {
    this.logger.info(`${username} disconnected`)
  }

  async sendRooms (socket) {
    try {
      const rooms = await this.app.db.collection('rooms').find({}).toArray()

      socket.emit('rooms', rooms)
    } catch (e) {
      this.logger.error('sendRooms', e.message)
      socket.disconnect()
    }

    return true
  }

  /**
   * Create room and emit events: 'create room success', 'create room error', 'new room'
   * @param {Socket} socket - clients socket
   * @param {string} username
   * @param {string} name
   * @param {RoomType} type
   * @return {Promise<boolean>}
   */
  async createRoom (socket, username, name, type) {
    try {
      const dbRoom = await this.app.db.collection('rooms').findOne({
        name: name
      })

      if (dbRoom === null) {
        // possible to create stronger salt
        const hash = crypto.createHmac('sha256', 'salt')
          .update(name)
          .digest('hex')

        /**
         * @type {Room}
         */
        const room = {
          name,
          type,
          hash,
          creator: username
        }

        await this.app.db.collection('rooms').insertOne(room)

        socket.emit('create room success', room)

        if (type === 0) {
          socket.broadcast('new room', room)
        }
      } else {
        socket.emit('create room error', `Name '${name}' is busy`)
      }
    } catch (e) {
      this.logger.error('createRoom', e.message)
      socket.emit('create room error', `Can not create room ${name}`)
    }

    return true
  }
}

module.exports = Socket
