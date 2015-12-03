'use babel'

import {CompositeDisposable, Emitter} from 'sb-event-kit'

export default class Communication {
  constructor(debug) {
    this.debug = Boolean(debug)
    this.emitter = new Emitter()
    this.subscriptions = new CompositeDisposable

    this.emitter.on('request', message => {
      message.response = null

      const response = new Promise(resolve => {
        this.emitter.emit(`request:${message.type}`, message.data, message)
        resolve()
      })

      response.then(function() {
        return true
      }, function(val) {
        if (val instanceof Error) {
          const error = {__sb_is_error: true}
          Object.getOwnPropertyNames(val).forEach(function(key){
            error[key] = val[key]
          })
          message.response = error
        } else message.response = val
        return false
      }).then(status => {
        this.emitter.emit('send', {
          id: message.id, sb_communication: true, status, type: 'response', data: message.response
        })
      })
    })
    this.emitter.on('response', message => {
      this.emitter.emit(`job:${message.id}`, message.data && message.data.__sb_is_error ? Communication.createError(message.data) : message.data)
    })
  }
  parseMessage(messageGiven) {
    let message
    try {
      message = typeof messageGiven === 'string' ? JSON.parse(messageGiven) : messageGiven
    } catch (_) {
      throw new Error('Error decoding response')
    }
    if (!message.sb_communication) {
      // Ignore unknown messages
      return
    }
    if (this.debug) {
      console.debug(message)
    }
    this.emitter.emit(message.type, message)
  }
  request(name, data) {
    return new Promise((resolve, reject) => {
      const id = Communication.randomId()
      const disposable = this.emitter.on(`job:${id}`, function(result) {
        disposable.dispose()
        if (result.status) {
          resolve(result.data)
        } else reject(result.data)
      })
      this.emitter.emit('send', {
        id, sb_communication: true, name, type: 'request', data
      })
    })
  }
  onSend(callback) {
    return this.emitter.on('send', callback)
  }
  dispose() {
    this.subscriptions.dispose()
    this.emitter.dispose()
  }
  static randomId() {
    return (Math.random().toString(36) + '00000000000000000').slice(2, 7+2)
  }
  static createError(data) {
    const error = new Error()
    for (const key in data) {
      if (key !== '__sb_is_error') {
        error[key] = data[key]
      }
    }
    return error
  }
}
