/* eslint-disable no-undef */
process.env.NODE_ENV = 'test'

const chai = require('chai')
const chaiHttp = require('chai-http')
const { baseApiRoute } = require('../config')
const should = chai.should()
chai.use(chaiHttp)

const server = require('../src/index')
const TEST_USER = 'test'
describe('Authentication', () => {
  describe('POST /login', () => {
    it('should set username cookie', (done) => {
      chai.request(server)
        .post(`${baseApiRoute}/login`)
        .send({
          username: TEST_USER
        })
        .end((err, res) => {
          should.not.exist(err)
          res.status.should.eql(200)

          res.headers['set-cookie'][0].should.eql(`username=${TEST_USER}; path=/; httponly`)
          done()
        })
    })

    it('should not set cookies with wrong username', (done) => {
      chai.request(server)
        .post(`${baseApiRoute}/login`)
        .send({
          username: 228
        })
        .end((err, res) => {
          should.not.exist(err)
          should.not.exist(res.headers['set-cookie'])
          done()
        })
    })

    it('should set error status and message with wrong username', (done) => {
      chai.request(server)
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

    it('should not set cookies with empty username', (done) => {
      chai.request(server)
        .post(`${baseApiRoute}/login`)
        .send({
          username: ''
        })
        .end((err, res) => {
          should.not.exist(err)
          should.not.exist(res.headers['set-cookie'])
          done()
        })
    })

    it('should set error status and message with empty username', (done) => {
      chai.request(server)
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
})
