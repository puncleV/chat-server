/**
 * @enum {string}
 */
const MessageEvents = {
  MESSAGE: 'new message',
  MESSAGE_SUCCESS: 'new message success',
  MESSAGE_ERROR: 'new message error',
  SEND_MESSAGES: 'messages'
}

module.exports = Object.freeze(MessageEvents)
