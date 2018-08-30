/**
 * @typedef {object} User
 * @property {mongo.ObjectID} _id - user id
 * @property {string} username username
 * @property {boolean} online online status
 */

/**
 * @typedef {object} Room
 * @property {mongo.ObjectID} _id - user id
 * @property {string} name room name
 * @property {hash} name room name
 * @property {string} creator room creator
 * @property {Array.<string>} accessGranted users with access, empty on public
 * @property {RoomType} type rooms type
 */

/**
 * @typedef {object} Message
 * @property {mongo.ObjectID} _id - message id
 * @property {string} from message from
 * @property {string} text message text
 * @property {number} datetime message text
 * @property {mongo.ObjectID} roomId
 */

/**
 * @typedef {number} RoomType
 * @description 0 - public; 1 - private;
 */

/**
 * @typedef {object} NormalizedRoom
 * @description need to send room's data for user
 * @property {string} name
 * @property {RoomType} type
 * @property {string} hash
 * @property {string} creator
 * @property {number} usersCount
 */