const UserEntity = require('./user')
const RoomEntity = require('./room')

class Api {
  constructor (db) {
    this.db = db
  }

  /**
   * Returns entity api
   * @param {string} entity
   * @return {UserEntity|RoomEntity}
   */
  get (entity) {
    switch (entity) {
      case 'user':
        return new UserEntity(this.db)
      case 'room':
        return new RoomEntity(this.db)
      default:
        return null
    }
  }
}

module.exports = Api
