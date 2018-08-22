class UserApi {
  /**
   * Login function
   * @param {mongo.Collection} usersCollection
   * @param {string} username
   * @return {Promise<void>}
   */
  static async login (usersCollection, username) {
    return usersCollection.findOneAndUpdate(
      {
        username
      }, {
        $setOnInsert: {
          username,
          rooms: [],
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

  static async logout (usersCollection, username) {
    return usersCollection.findOneAndUpdate(
      {
        username
      }, {
        $set: {
          currentRoom: '',
          online: false
        }
      }
    )
  }
}

module.exports = UserApi
