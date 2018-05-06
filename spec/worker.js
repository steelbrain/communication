// @flow

const Communication = require('../')

const communication = new Communication({
  listener(callback) {
    process.on('message', callback)
  },
  send(payload) {
    process.send(payload)
  },
})

communication.on('ping', function(arg) {
  return new Promise(function(resolve) {
    resolve(`pong ${arg}`)
  })
})
communication.on('ping2', function(arg) {
  return `pong2 ${arg}`
})
communication.on('ping3', function(arg) {
  return new Promise(function(resolve, reject) {
    reject(new Error(`pong3 ${arg}`))
  })
})
communication.on('ping4', function(arg) {
  throw new Error(`pong4 ${arg}`)
})
