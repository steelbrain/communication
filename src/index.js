// @flow

import invariant from 'assert'

type Handle = {|
  send(payload: Object): void,
  listener(callback: (message: Object) => void): void,
|}

class Communication {
  alive: boolean
  handle: Handle
  handlers: { [string]: Function } = {}
  outgoing: { [string]: { resolve: Function, reject: Function } } = {}
  constructor(handle: Handle) {
    invariant(typeof handle === 'object' && handle, 'handle must be a valid object')
    invariant(typeof handle.send === 'function', 'handle.send must be a valid function')
    invariant(typeof handle.listener === 'function', 'handle.listener must be a valid function')

    this.alive = true
    this.handle = handle

    this.handle.listener(message => {
      if (!this.alive || !message.__sb_communication) {
        return
      }
      this.__handleMessage(message)
    })
  }
  __getId() {
    let id
    do {
      id = Math.random()
        .toString(36)
        .substring(7)
    } while (this.outgoing[id])
    return id
  }
  __handleMessage(message: Object) {
    if (message.type === 'request') {
      const response = {
        __sb_id: message.__sb_id,
        __sb_communication: true,
        successful: true,
        payload: undefined,
        type: 'response',
      }
      const handler = this.handlers[message.event]
      if (!handler) {
        if (this.alive) {
          this.handle.send(message)
        }
      } else {
        const result = new Promise(function(resolve) {
          resolve(handler(message.payload))
        })
        result
          .then(payload => {
            response.payload = payload
          })
          .catch(error => {
            response.successful = false
            response.payload = error
          })
          .then(() => {
            if (this.alive) {
              if (response.payload && typeof response.payload === 'object') {
                const masked = {}
                Object.getOwnPropertyNames(response.payload).forEach(function(key) {
                  masked[key] = response.payload[key]
                })
                response.payload = masked
              }
              this.handle.send(response)
            }
          })
      }
    } else if (message.type === 'response') {
      const outgoing = this.outgoing[message.__sb_id]
      if (outgoing) {
        this.outgoing[message.__sb_id] = null
        outgoing[message.successful ? 'resolve' : 'reject'](message.payload)
      }
    }
  }
  on(event: string, callback: Function, force: boolean = false) {
    invariant(typeof event === 'string' && event, 'event must be a valid string')
    invariant(typeof callback === 'function', 'callback must be a valid function')

    if (!force && this.handlers[event]) {
      throw new Error(`Event '${event}' has a listener setup already`)
    }
    this.handlers[event] = callback
  }
  send(event: string, payload: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.alive) {
        reject(new Error('Communication bridge is no longer active'))
        return
      }

      const message = {
        __sb_id: this.__getId(),
        __sb_communication: true,
        event,
        payload,
        type: 'request',
      }
      this.outgoing[message.__sb_id] = { resolve, reject }
      this.handle.send(message)
    })
  }
  dispose() {
    this.alive = false
  }
}

module.exports = Communication
