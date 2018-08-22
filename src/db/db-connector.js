module.exports = async function (app, config) {
  const MongoClient = require('mongodb').MongoClient
  const client = await MongoClient.connect(config.url, {useNewUrlParser: true})

  app.db = await client.db(config.db)
}
