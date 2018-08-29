/**
 * @enum {string}
 */
const ROOM_EVENTS = {
  CREATE_REQUEST: 'create room',
  CREATE: 'create new room',
  SEND: 'rooms',
  CREATE_SUCCESS: 'create room success',
  CREATE_ERROR: 'create room error'
}

module.exports = Object.freeze(ROOM_EVENTS)
