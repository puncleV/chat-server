module.exports = {
  server: {
    port: process.env.SERVER_PORT || 1734
  },
  baseApiRoute: '/api',
  appSecrets: ['chat.super.secret.no.key'],
  session: {
    key: 'chat:session',
    maxAge: 24 * 60 * 60 * 1000,
    overwrite: true,
    httpOnly: true,
    signed: true,
    rolling: false,
    renew: false
  },
  auth: {
    usernameMaxLength: 25,
    baseRoute: '/auth'
  },
  mongo: {
    url: process.env.MONGO_URL || 'mongodb://localhost:27017',
    db: 'chat'
  },
  cors: {
    origin: process.env.FRONT_URL || 'http://localhost:3000',
    credentials: true
  }
}
