/* eslint-disable no-undef */
process.env.NODE_ENV = 'test'

const chai = require('chai')
const chaiHttp = require('chai-http')
const { baseApiRoute } = require('../config')
const should = chai.should()
chai.use(chaiHttp)

const server = require('../src/index')

describe('Authentication', () => {
  describe('POST /login', () => {
    it('should do login', (done) => {
      chai.request(server)
        .post(`${baseApiRoute}/login`)
        .send({
          username: 'user'
        })
        .end((err, res) => {
          should.not.exist(err)
          res.status.should.eql(200)
          done()
        })
    })
  })
})
