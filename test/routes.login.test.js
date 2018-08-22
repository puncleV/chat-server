/* eslint-disable no-undef */
process.env.NODE_ENV = 'test'

const chai = require('chai')
const chaiHttp = require('chai-http')
const expect = chai.expect
const { baseApiRoute } = require('../config')
const should = chai.should()
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

describe('Authentication', () => {
  const server = new Server({
    appSecrets,
    serverConfig,
    sessionConfig,
    mongoConfig
  })

  describe('POST /login', () => {
    it('should set cookies', (done) => {
      server.initialize().then(() => {
        chai.request(server.getServer())
          .post(`${baseApiRoute}/login`)
          .send({
            username: TEST_USER
          })
          .end((err, res) => {
            should.not.exist(err)
            res.status.should.eql(200)

            expect(res).to.have.cookie('chat:session')
            done()
          })
      })
    })

    it('should not set cookies with wrong username', (done) => {
      server.initialize().then(() => {
        chai.request(server.getServer())
          .post(`${baseApiRoute}/login`)
          .send({
            username: 228
          })
          .end((err, res) => {
            should.not.exist(err)
            expect(res).to.not.have.cookie('chat:session')
            done()
          })
      })
    })

    it('should set error status and message with wrong username', (done) => {
      server.initialize().then(() => {
        chai.request(server.getServer())
          .post(`${baseApiRoute}/login`)
          .send({
            username: 228
          })
          .end((err, res) => {
            should.not.exist(err)
            res.status.should.eql(400)
            res.body.status.should.eql('error')
            res.body.message.should.eql('wrong username')
            done()
          })
      })
    })

    it('should not set cookies with empty username', (done) => {
      server.initialize().then(() => {
        chai.request(server.getServer())
          .post(`${baseApiRoute}/login`)
          .send({
            username: ''
          })
          .end((err, res) => {
            should.not.exist(err)
            expect(res).to.not.have.cookie('chat:session')
            done()
          })
      })
    })

    it('should set error status and message with empty username', (done) => {
      server.initialize().then(() => {
        chai.request(server.getServer())
          .post(`${baseApiRoute}/login`)
          .send({
            username: ''
          })
          .end((err, res) => {
            should.not.exist(err)
            res.status.should.eql(400)
            res.body.status.should.eql('error')
            res.body.message.should.eql('wrong username')
            done()
          })
      })
    })

    it('should not login with too long username', (done) => {
      server.initialize().then(() => {
        chai.request(server.getServer())
          .post(`${baseApiRoute}/login`)
          .send({
            username: LONG_USER
          })
          .end((err, res) => {
            should.not.exist(err)
            expect(res).to.not.have.cookie('chat:session')

            done()
          })
      })
    })

    it('should set error status with too long username', (done) => {
      server.initialize().then(() => {
        chai.request(server.getServer())
          .post(`${baseApiRoute}/login`)
          .send({
            username: LONG_USER
          })
          .end((err, res) => {
            should.not.exist(err)

            res.status.should.eql(400)
            res.body.status.should.eql('error')
            res.body.message.should.eql('wrong username length')

            done()
          })
      })
    })
  })

  describe('POST /checkLogin', () => {
    let agent

    beforeEach((done) => {
      const server = new Server({
        appSecrets,
        serverConfig,
        sessionConfig,
        mongoConfig
      })

      server.initialize().then(() => {
        agent = chai.request.agent(server.getServer())
        done()
      })
    })

    afterEach(() => {
      agent.close()
    })

    it('should return success', (done) => {
      agent.post(`${baseApiRoute}/login`)
        .send({
          username: TEST_USER
        })
        .then(postRes => {
          return agent.get(`${baseApiRoute}/checkLogin`)
            .then(res => {
              res.status.should.eql(200)
              res.body.status.should.eql('success')

              done()
            })
        })
    })

    it('should return 401', (done) => {
      agent.get(`${baseApiRoute}/checkLogin`)
        .then(res => {
          res.status.should.eql(401)
          res.body.status.should.eql('error')
          res.body.message.should.eql('not authenticated')

          done()
        })
    })
  })
})
