class UserEntity {
  constructor (db) {
    this.db = db
  }

  /**
   * Add user or update his online status
   *
   * @param {string} username
   */
  async addOrUpdateUser (username) {
    await this.db.collection('users').findOneAndUpdate(
      {
        username
      }, {
        $setOnInsert: {
          username,
          currentRoom: ''
        },
        $set: {
          online: true
        }
      }, {
        upsert: true
      }
    )
  }

  /**
   * Finds users by current room's hash
   *
   * @param {string} currentRoom
   * @return {Promise.<Array.<User>>}
   */
  findAllByCurrentRoom (currentRoom) {
    return this.db.collection('users').find({
      currentRoom
    }).toArray()
  }

  /**
   * Set user's currentRoom
   * @param {string} username
   * @param {string=} [roomHash = ''] hash to set
   */
  setUserRoom (username, roomHash = '') {
    return this.db.collection('users').updateOne({
      username
    }, {
      $set: {
        currentRoom: roomHash
      }
    })
  }

  /**
   * Find user bu username
   * @param username
   * @return {Promise.<User>}
   */
  findOneByUsername (username) {
    return this.db.collection('users').findOne({
      username
    })
  }

  /**
   * Sets online status for user
   * @param {string} username
   * @param {boolean} value
   * @return {Promise<void>}
   */
  async setOnlineByUsername (username, value) {
    await this.db.collection('users').findOneAndUpdate(
      {
        username
      }, {
        $set: {
          online: value
        }
      }
    )
  }
}

module.exports = UserEntity
