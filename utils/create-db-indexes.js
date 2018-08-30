const config = require('../config')

const main = async () => {
  const MongoClient = require('mongodb').MongoClient
  const client = await MongoClient.connect(config.mongo.url, {useNewUrlParser: true})
  const db = await client.db(config.mongo.db)
  const userCollection = await db.collection('users')
  const roomCollection = await db.collection('rooms')
  const messageCollection = await db.collection('messages')

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
      currentRoom: 1
    })
  } catch (e) {
    console.log('Users: currentRoom create index error:', e)
  }

  try {
    await roomCollection.createIndex({
      accessGranted: 1,
      type: 1
    })
  } catch (e) {
    console.log('Rooms: accessGranted + type create index error:', e)
  }

  try {
    await roomCollection.createIndex({
      name: 1
    }, {
      unique: true
    })
  } catch (e) {
    console.log('Rooms: name create index error:', e)
  }

  try {
    await roomCollection.createIndex({
      hash: 1
    }, {
      unique: true
    })
  } catch (e) {
    console.log('Rooms: hash create index error:', e)
  }

  try {
    await messageCollection.createIndex({
      roomId: 1
    })
  } catch (e) {
    console.log('Messages: roomId create index error:', e)
  }

  process.exit(0)
}

main()
