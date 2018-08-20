/* eslint-disable no-undef */
process.env.NODE_ENV = 'test'

const chai = require('chai')
const should = chai.should()
const chaiHttp = require('chai-http')
chai.use(chaiHttp)

const server = require('../src/index')

describe('routes : index', () => {
  describe('GET /', () => {
    it('should return hi', (done) => {
      chai.request(server)
        .get('/api')
        .end((err, res) => {
          should.not.exist(err)
          res.status.should.eql(200)
          // res.type.should.eql('application/json')
          // res.body.status.should.equal('success')
          res.body.message.should.eql('hi')
          done()
        })
    })
  })
})
