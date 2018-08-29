const ROOM_TYPES = require('../enums/room-types')
class RoomEntity {
  constructor (db) {
    this.db = db
  }

  /**
   * Finds room by hash
   *
   * @param {string} hash
   */
  findOneByHash (hash) {
    return this.db.collection('rooms').findOne({ hash })
  }

  /**
   * Finds room by hash
   *
   * @param {string} name
   * @return {Room}
   */
  findOneByName (name) {
    return this.db.collection('rooms').findOne({ name })
  }

  /**
   * Finds list of rooms available for user
   * @param {string} username
   * @return {Array.<NormalizedRoom>}
   */
  findRoomListForUsername (username) {
    return this.db.collection('rooms').aggregate([
      {
        $match: {
          $or: [
            {
              accessGranted: {$in: [ username ]}
            },
            {
              type: ROOM_TYPES.public
            }
          ]
        }
      }, {
        $lookup: {
          from: 'users',
          localField: 'hash',
          foreignField: 'currentRoom',
          as: 'users'
        }
      }, {
        $project: {
          _id: 0,
          name: 1,
          type: 1,
          hash: 1,
          creator: 1,
          usersCount: {
            $size: '$users'
          }
        }
      }
    ]).toArray()
  }

  /**
   * Adds room
   * @param {Room} room
   * @return {Promise}
   */
  addOne (room) {
    return this.db.collection('rooms').insertOne(room)
  }
}

module.exports = RoomEntity
