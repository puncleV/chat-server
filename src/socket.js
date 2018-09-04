const socket = require('socket.io')
const http = require('http')
const crypto = require('crypto')

const logger = require('./logger')
const RoomTypes = require('./enums/room-types')
const RoomEvents = require('./enums/room-events')
const MessageEvents = require('./enums/message-events')
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
      logger.error(err)
    }

    return next(error)
  }

  async onConnection (socket) {
    logger.info(`${socket.session.username} connection`)

    await this.sendRooms(socket, socket.session.username)

    socket.on(RoomEvents.CREATE, this.onCreateRoom.bind(this, socket, socket.session.username))
    socket.on(RoomEvents.JOIN, this.onJoin.bind(this, socket, socket.session.username))
    socket.on(RoomEvents.LEAVE, this.onLeaveRoom.bind(this, socket, socket.session.username))
    socket.on(RoomEvents.ADD, this.onAddRoom.bind(this, socket, socket.session.username))
    socket.on(RoomEvents.REMOVE, this.onRemoveRoom.bind(this, socket, socket.session.username))
    socket.on(MessageEvents.MESSAGE, this.onMessage.bind(this, socket, socket.session.username))

    socket.on('disconnect', this.onDisconnect.bind(this, socket, socket.session.username))
  }

  async onDisconnect (socket, username) {
    logger.info(`${username} disconnected`)

    await this.onLeaveRoom(socket, username)
  }

  async onLeaveRoom (socket, username) {
    try {
      const user = await this.app.api.get('user').findOneByUsername(username)

      if (user.currentRoom) {
        await this.app.api.get('user').setUserRoom(username, '')

        const room = await this.app.api.get('room').findOneByHash(user.currentRoom)

        this.emitEventToRoomParticipants(socket, RoomEvents.USER_LEAVE, room, {roomHash: room, username})

        socket.emit(RoomEvents.USER_LEAVE, { username, roomHash: user.currentRoom })
      }
    } catch (e) {
      logger.error(`leave room | ${e.message}`)
    }
  }

  /**
   * create room handler
   * @param {Socket} socket - clients socket
   * @param {object} username
   * @param {object} roomInfo
   * @param {string} roomInfo.name
   * @param {RoomType} roomInfo.type
   * @return {Promise<void>}
   */
  async onCreateRoom (socket, username, { name, type }) {
    if (
      typeof name === 'string' && name.length &&
      typeof type === 'number' && type in Object.values(RoomTypes)
    ) {
      logger.info(`${username} creating room ${name}`)

      await this.createRoom(socket, username, { name, type })
    }
  }

  async sendRooms (socket, username) {
    try {
      const rooms = await this.app.api.get('room').findRoomListForUsername(username)

      socket.emit(RoomEvents.SEND, rooms)
    } catch (e) {
      logger.error(`sendRooms ${e.message}`)
      socket.disconnect()
    }

    return true
  }

  /**
   * Create room and emit events: 'create room success', 'create room error', 'new room'
   * @param {Socket} socket - clients socket
   * @param {string} username
   * @param {object} roomInfo
   * @param {string} roomInfo.name
   * @param {RoomType} roomInfo.type
   * @return {Promise<boolean>}
   */
  async createRoom (socket, username, {name, type}) {
    try {
      const dbRoom = await this.app.api.get('room').findOneByName(name)

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

        if (type === RoomTypes.private) {
          room.accessGranted = [ username ]
        }

        await this.app.api.get('room').addOne(room)

        room.usersCount = 0

        socket.emit(RoomEvents.CREATE_SUCCESS, room)

        if (type === RoomTypes.public) {
          socket.broadcast.emit(RoomEvents.NEW, room)
        }
      } else {
        socket.emit(RoomEvents.CREATE_ERROR, `Name '${name}' is busy`)
      }
    } catch (e) {
      logger.error('createRoom', e)
      socket.emit(RoomEvents.CREATE_ERROR, `Can not create room ${name}`)
    }

    return true
  }

  /**
   * Handle join event
   * @param {Socket} socket - clients socket
   * @param {string} username
   * @param {string} hash room's hash
   */
  async onJoin (socket, username, { hash }) {
    logger.info(`${username} is joining room ${hash}`)

    try {
      const dbRoom = await this.app.api.get('room').findOneByHash(hash)

      if (dbRoom === null) {
        socket.emit(RoomEvents.JOIN_ERROR, `room does not exist`)
      } else {
        const users = await this.app.api.get('user').findAllByCurrentRoom(hash)
        const messages = await this.app.api.get('message').findByRoomId(dbRoom._id)

        await this.app.api.get('user').setUserRoom(username, hash)

        this.emitEventToRoomParticipants(socket, RoomEvents.USER_JOINED, dbRoom, { roomHash: dbRoom.hash, username })

        socket.emit(RoomEvents.JOIN_SUCCESS, {
          username,
          hash,
          users,
          messages
        })

        logger.info(`${username} is joined room ${hash}`)
      }
    } catch (e) {
      logger.error(`join room ${e.message}`)

      socket.emit(RoomEvents.JOIN_ERROR, `can not join room`)
    }
  }

  emitEventToRoomParticipants (socket, event, room, message) {
    if (room.type === RoomTypes.private) {
      Object.values(this.io.clients().connected).forEach(
        clientSocket => {
          if (room.accessGranted.includes(clientSocket.session.username)) {
            clientSocket.emit(event, message)
          }
        }
      )
    } else {
      socket.broadcast.emit(event, message)
    }
  }

  /**
   * Add room to user
   * @param {Socket} socket
   * @param {string} username
   * @param {string} hash
   * @return {Promise<void>}
   */
  async onAddRoom (socket, username, { hash }) {
    try {
      const dbRoom = await this.app.api.get('room').findOneByHash(hash)

      if (dbRoom === null) {
        socket.emit(RoomEvents.ADD_ERROR, `room does not exist`)
      } else {
        if (dbRoom.type === RoomTypes.public || dbRoom.accessGranted.includes(username)) {
          socket.emit(RoomEvents.ADD_ERROR, `you are already have this room`)

          return
        }

        dbRoom.accessGranted.push(username)

        await this.app.api.get('room').update(dbRoom)

        await this.sendRooms(socket, username)

        logger.info(`${username} added ${hash}`)
      }
    } catch (e) {
      logger.error(`add room ${e.message}`)

      socket.emit(RoomEvents.ADD_ERROR, `can not add room`)
    }
  }

  async onRemoveRoom (socket, username, { hash }) {
    try {
      const dbRoom = await this.app.api.get('room').findOneByHash(hash)

      if (dbRoom === null) {
        socket.emit(RoomEvents.REMOVE_ERROR, `room does not exist`)
      } else {
        if (dbRoom.type === RoomTypes.public || !dbRoom.accessGranted.includes(username)) {
          socket.emit(RoomEvents.REMOVE_ERROR, `you can not remove this room`)

          return
        }

        dbRoom.accessGranted = dbRoom.accessGranted.filter(user => user !== username)

        await this.app.api.get('room').update(dbRoom)

        logger.info(`${username} removed ${hash}`)

        await this.sendRooms(socket, username)
      }
    } catch (e) {
      logger.error(`remove room ${e.message}`)

      socket.emit(RoomEvents.REMOVE_ERROR, `can not remove room`)
    }
  }

  async onMessage (socket, username, { roomHash, message }) {
    if (typeof message !== 'string') {
      socket.emit(MessageEvents.MESSAGE_ERROR, `wrong message format`)
      return
    }

    try {
      const dbRoom = await this.app.api.get('room').findOneByHash(roomHash)

      if (dbRoom === null) {
        socket.emit(MessageEvents.MESSAGE_ERROR, `room does not exist`)
      } else {
        const datetime = Date.now()

        await this.app.api.get('message').addOne(username, message, datetime, dbRoom._id)

        logger.info(`${username} send message`)

        this.emitEventToRoomParticipants(
          socket, MessageEvents.MESSAGE, dbRoom,
          {
            from: username, message, datetime, roomHash
          }
        )

        socket.emit(MessageEvents.MESSAGE_SUCCESS, {
          from: username, message, datetime, roomHash
        })
      }
    } catch (e) {
      logger.error(`remove room ${e.message}`)

      socket.emit(MessageEvents.MESSAGE_ERROR, `can not send message`)
    }
  }
}

module.exports = Socket
