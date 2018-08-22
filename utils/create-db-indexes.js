const config = require('../config')

const main = async () => {
  const MongoClient = require('mongodb').MongoClient
  const client = await MongoClient.connect(config.mongo.url, {useNewUrlParser: true})
  const db = await client.db(config.mongo.db)
  const userCollection = await db.collection('users')
  const roomCollection = await db.collection('rooms')

  try {
    await userCollection.createIndex({
      username: 1
    }, {
      unique: true
    })
  } catch (e) {
    console.log('Users: username create index error:', e)
  }

  try {
    // to performance when looking for users in current room
    await userCollection.createIndex({
      username: 1,
      currentRoom: 1
    })
  } catch (e) {
    console.log('Users: username + currentRoom create index error:', e)
  }

  try {
    await roomCollection.createIndex({
      creator: 1
    })
  } catch (e) {
    console.log('Rooms: creator create index error:', e)
  }

  try {
    await roomCollection.createIndex({
      name: 1
    }, {
      unique: true
    })
  } catch (e) {
    console.log('Rooms: creator create index error:', e)
  }

  process.exit(0)
}

main()
