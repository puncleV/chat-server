/**
 * @enum {string}
 */
const ROOM_EVENTS = {
  CREATE: 'create room',
  CREATE_SUCCESS: 'create room success',
  CREATE_ERROR: 'create room error',
  SEND: 'rooms',
  NEW: 'new room',
  JOIN: 'join room',
  JOIN_SUCCESS: 'join room success',
  JOIN_ERROR: 'join room error',
  USER_JOINED: 'user joined'
}

module.exports = Object.freeze(ROOM_EVENTS)
