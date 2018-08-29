/**
 * @typedef {object} User
 * @property {mongo.ObjectID} _id - user id
 * @property {string} username username
 * @property {Array.<string>} privateRooms private room keys
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
 * @property {string} to message to (all - to all)
 * @property {string} from message from
 * @property {string} text message text
 * @property {mongo.ObjectID} room id
 */

/**
 * @typedef {number} RoomType
 * @description 0 - public; 1 - private;
 */
