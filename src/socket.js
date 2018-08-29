const socket = require('socket.io')
const http = require('http')
const crypto = require('crypto')

const ROOM_TYPES = require('./enums/room-types')
const ROOM_EVENTS = require('./enums/room-events')
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

    await this.sendRooms(socket, socket.session.username)

    socket.on(ROOM_EVENTS.CREATE, this.onCreateRoom.bind(this, socket, socket.session.username))
    socket.on(ROOM_EVENTS.JOIN, this.onJoin.bind(this, socket, socket.session.username))
    socket.on(ROOM_EVENTS.LEAVE, this.onLeaveRoom.bind(this, socket, socket.session.username))
    socket.on('disconnect', this.onDisconnect.bind(this, socket, socket.session.username))
  }

  async onDisconnect (socket, username) {
    this.logger.info(`${username} disconnected`)

    await this.onLeaveRoom(socket, username)
  }

  async onLeaveRoom (socket, username) {
    try {
      const user = await this.app.api.get('user').findOneByUsername(username)

      if (user.currentRoom) {
        await this.app.api.get('user').setUserRoom(username, '')

        const room = await this.app.api.get('room').findOneByHash(user.currentRoom)

        this.sendMessageToRoomParticipants(socket, ROOM_EVENTS.USER_LEAVE, room, username)

        socket.emit(ROOM_EVENTS.USER_LEAVE, { username, roomHash: user.currentRoom })
      }
    } catch (e) {
      this.logger.error(`leave room | ${e.message}`)
    }
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
      typeof type === 'number' && type in Object.values(ROOM_TYPES)
    ) {
      this.logger.info(`${username} creating room ${roomName}`)

      await this.createRoom(socket, username, roomName, type)
    }
  }

  async sendRooms (socket, username) {
    try {
      const rooms = await this.app.api.get('room').findRoomListForUsername(username)

      socket.emit(ROOM_EVENTS.SEND, rooms)
    } catch (e) {
      this.logger.error(`sendRooms ${e.message}`)
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

        if (type === ROOM_TYPES.private) {
          room.accessGranted = [ username ]
        }

        await this.app.api.get('room').addOne(room)

        socket.emit(ROOM_EVENTS.CREATE_SUCCESS, room)

        if (type === ROOM_TYPES.public) {
          socket.broadcast.emit(ROOM_EVENTS.NEW, room)
        }
      } else {
        socket.emit(ROOM_EVENTS.CREATE_ERROR, `Name '${name}' is busy`)
      }
    } catch (e) {
      this.logger.error('createRoom', e.message)
      socket.emit(ROOM_EVENTS.CREATE_ERROR, `Can not create room ${name}`)
    }

    return true
  }

  /**
   * Handle join event
   * @param {Socket} socket - clients socket
   * @param {string} username
   * @param {string} roomHash room's hash
   */
  async onJoin (socket, username, roomHash) {
    this.logger.info(`${username} is joining room ${roomHash}`)

    try {
      const dbRoom = await this.app.api.get('room').findOneByHash(roomHash)

      if (dbRoom === null) {
        socket.emit(ROOM_EVENTS.JOIN_ERROR, `room does not exist`)
      } else {
        const users = await this.app.api.get('user').findAllByCurrentRoom(roomHash)

        await this.app.api.get('user').setUserRoom(username, roomHash)

        this.sendMessageToRoomParticipants(socket, ROOM_EVENTS.USER_JOINED, dbRoom, username)

        socket.emit(ROOM_EVENTS.JOIN_SUCCESS, {
          username,
          roomHash,
          users
        })

        this.logger.info(`${username} is joined room ${roomHash}`)
      }
    } catch (e) {
      this.logger.error(`join room ${e.message}`)
      socket.emit(ROOM_EVENTS.JOIN_ERROR, `can not join room`)
    }
  }

  sendMessageToRoomParticipants (socket, event, room, username) {
    if (room.type === ROOM_TYPES.private) {
      Object.values(this.io
        .clients()
        .connected
      )
        .forEach(clientSocket => {
          if (clientSocket.session.username in room.accessGranted) {
            clientSocket.emit(event, { username, roomHash: room.hash })
          }
        })
    } else {
      socket.broadcast.emit(event, { username, roomHash: room.hash })
    }
  }
}

module.exports = Socket
