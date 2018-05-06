'use babel'

import path from 'path'
import { it } from 'jasmine-fix'
import childProcess from 'child_process'

import Communication from '../'

describe('SB-Communication', function() {
  let forkedProcess = null

  beforeEach(function() {
    forkedProcess = childProcess.fork(path.join(__dirname, 'worker.js'))
  })
  afterEach(function() {
    if (forkedProcess) {
      forkedProcess.kill()
    }
  })

  it('works as expected', async function() {
    const communication = new Communication({
      onMessage(callback) {
        forkedProcess.on('message', callback)
      },
      send(message) {
        forkedProcess.send(message)
      },
    })

    expect(await communication.send('ping', 52)).toBe('pong 52')
    expect(await communication.send('ping2', 53)).toBe('pong2 53')

    try {
      await communication.send('ping3', 54)
      expect(false).toBe(true)
    } catch (error) {
      expect(error.message).toBe('pong3 54')
    }

    try {
      await communication.send('ping4', 55)
      expect(false).toBe(true)
    } catch (error) {
      expect(error.message).toBe('pong4 55')
    }
  })
})
