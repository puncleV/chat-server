/**
 * @typedef {object} User
 * @property {mongo.ObjectID} _id - user id
 * @property {string} username username
 * @property {Array.<string>} rooms room keys
 * @property {boolean} online online status
 */

/**
 * @typedef {object} Rooom
 * @property {mongo.ObjectID} _id - user id
 * @property {string} name room name
 * @property {string} creator room creator
 * @property {RoomType} type rooms type
 */

/**
 * @typedef {number} RoomType
 * @description 0 - public; 1 - private;
 */
