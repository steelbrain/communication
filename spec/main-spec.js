'use babel'

import Communication from '../'

describe('SB-Communication', function() {
  it('works as expected', function() {
    const first = new Communication()
    const second = new Communication()

    first.onShouldSend(function(message) {
      second.parseMessage(message)
    })
    second.onShouldSend(function(message) {
      first.parseMessage(message)
    })

    first.onRequest('ping1', function(data, message) {
      message.response = new Promise(function(resolve) {
        resolve('pong1')
      })
    })
    second.onRequest('ping2', function(data, message) {
      message.response = 'pong2'
    })

    first.onRequest('error', function() {
      throw new Error('An Error')
    })
    second.onRequest('error', function(_, message) {
      message.response = Promise.reject(new Error('Wow'))
    })

    waitsForPromise(function() {
      return first.request('ping2').then(function(response) {
        expect(response).toBe('pong2')
        return second.request('ping1')
      }).then(function(response) {
        expect(response).toBe('pong1')
        return first.request('error')
      }).then(function() {
        expect(false).toBe(true)
      }, function() {
        expect(true).toBe(true)
        return second.request('error')
      }).then(function() {
        expect(false).toBe(true)
      }, function() {
        expect(true).toBe(true)
      })
    })
  })
})
