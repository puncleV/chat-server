/* eslint-disable no-undef */
process.env.NODE_ENV = 'test'

const chai = require('chai')
const chaiHttp = require('chai-http')
const expect = chai.expect
const { baseApiRoute } = require('../config')
const should = chai.should()
const MongoClient = require('mongodb').MongoClient

chai.use(chaiHttp)

const {
  appSecrets,
  server: serverConfig,
  session: sessionConfig,
  mongo: mongoConfig
} = require('./test.config')

const Server = require('../src/server')
const TEST_USER = 'test'
const LONG_USER = '01234567899876543210123456'
const clearCollection = (collection) => collection.removeMany({})

describe('Authentication', () => {
  let mongoClient, usersColllection
  before(async () => {
    console.log('BEGIN')
    const connect = await MongoClient.connect(mongoConfig.url, {useNewUrlParser: true})
    mongoClient = await connect.db(mongoConfig.db)
    usersColllection = await mongoClient.collection('users')
  })
  after(async () => {
    await clearCollection(usersColllection)
    console.log('END')
  })
  describe('POST /login', () => {
    let agent

    beforeEach(async () => {
      const server = new Server({
        appSecrets,
        serverConfig,
        sessionConfig,
        mongoConfig
      })

      await server.initialize()
      agent = chai.request.agent(server.getServer())
    })

    afterEach(() => {
      agent.close()
    })

    it('should set cookies', async () => {
      const res = await agent
        .post(`${baseApiRoute}/login`)
        .send({
          username: TEST_USER
        })

      res.status.should.eql(200)
      expect(res).to.have.cookie(sessionConfig.key)
    })

    it('should not set cookies with wrong username', async () => {
      const res = await agent.post(`${baseApiRoute}/login`)
        .send({
          username: 228
        })
      expect(res).to.not.have.cookie(sessionConfig.key)
    })

    it('should set error status and message with wrong username', async () => {
      const res = await agent.post(`${baseApiRoute}/login`)
        .send({
          username: 228
        })

      res.status.should.eql(400)
      res.body.status.should.eql('error')
      res.body.message.should.eql('wrong username')
    })

    it('should not set cookies with empty username', async () => {
      const res = await agent.post(`${baseApiRoute}/login`)
        .send({
          username: ''
        })

      expect(res).to.not.have.cookie('chat:session')
    })

    it('should set error status and message with empty username', async () => {
      const res = await agent.post(`${baseApiRoute}/login`)
        .send({
          username: ''
        })

      res.status.should.eql(400)
      res.body.status.should.eql('error')
      res.body.message.should.eql('wrong username')
    })

    it('should not login with too long username', async () => {
      const res = await agent.post(`${baseApiRoute}/login`)
        .send({
          username: LONG_USER
        })

      expect(res).to.not.have.cookie('chat:session')
    })

    it('should set error status with too long username', async () => {
      const res = await agent.post(`${baseApiRoute}/login`)
        .send({
          username: LONG_USER
        })

      res.status.should.eql(400)
      res.body.status.should.eql('error')
      res.body.message.should.eql('wrong username length')
    })

    it('should be forbidden when we trying to login while logged in', async () => {
      await agent.post(`${baseApiRoute}/login`)
        .send({
          username: TEST_USER
        })

      const res = await agent.post(`${baseApiRoute}/login`)
        .send({
          username: TEST_USER + '1'
        })
      res.status.should.eql(403)
      res.body.status.should.eql('error')
      res.body.message.should.eql('access forbidden')
    })

    it('should create user after login', async () => {
      await agent.post(`${baseApiRoute}/login`)
        .send({
          username: TEST_USER
        })

      const user = await usersColllection.findOne({
        username: TEST_USER
      })

      should.exist(user)

      clearCollection(usersColllection)
    })

    it('should not create user when trying to login while logged in', async () => {
      await agent.post(`${baseApiRoute}/login`)
        .send({
          username: TEST_USER
        })

      await agent.post(`${baseApiRoute}/login`)
        .send({
          username: TEST_USER + '1'
        })

      const user = await usersColllection.findOne({
        username: TEST_USER + '1'
      })

      should.not.exist(user)

      clearCollection(usersColllection)
    })

    it('should user\'s online status after login', async () => {
      await usersColllection.insertOne({
        username: TEST_USER,
        online: false
      })

      await agent.post(`${baseApiRoute}/login`)
        .send({
          username: TEST_USER
        })

      const user = await usersColllection.findOne({
        username: TEST_USER
      })

      user.online.should.eql(true)

      clearCollection(usersColllection)
    })
  })

  describe('POST /checkLogin', () => {
    let agent

    beforeEach(async () => {
      const server = new Server({
        appSecrets,
        serverConfig,
        sessionConfig,
        mongoConfig
      })

      await server.initialize()
      agent = chai.request.agent(server.getServer())
    })

    afterEach(() => {
      agent.close()
    })

    it('should return success', async () => {
      await agent.post(`${baseApiRoute}/login`)
        .send({
          username: TEST_USER
        })

      const res = await agent.get(`${baseApiRoute}/checkLogin`)

      res.status.should.eql(200)
      res.body.status.should.eql('success')
    })

    it('should return 401', async () => {
      const res = await agent.get(`${baseApiRoute}/checkLogin`)

      res.status.should.eql(401)
      res.body.status.should.eql('error')
      res.body.message.should.eql('unauthorized')
    })
  })

  describe('POST /logout', () => {
    beforeEach(async () => {
      const server = new Server({
        appSecrets,
        serverConfig,
        sessionConfig,
        mongoConfig
      })

      await server.initialize()
      agent = chai.request.agent(server.getServer())
    })

    afterEach(() => {
      agent.close()
    })

    it('should logout user', async () => {
      await agent.post(`${baseApiRoute}/login`)
        .send({
          username: TEST_USER
        })

      const res = await agent.get(`${baseApiRoute}/logout`).send()

      res.status.should.eql(200)
      res.body.status.should.eql('success')

      clearCollection(usersColllection)
    })

    it('should set user\'s online status to false', async () => {
      await agent.post(`${baseApiRoute}/login`)
        .send({
          username: TEST_USER
        })
      await agent.get(`${baseApiRoute}/logout`).send()

      const user = await usersColllection.findOne({
        username: TEST_USER
      })

      user.online.should.eql(false)

      clearCollection(usersColllection)
    })

    it('should be unauthorized error while not logged in', async () => {
      const res = await agent.get(`${baseApiRoute}/logout`).send()

      res.status.should.eql(401)
      res.body.status.should.eql('error')
      res.body.message.should.eql('unauthorized')
    })
  })
})
