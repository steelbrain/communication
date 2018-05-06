// @flow

import invariant from 'assert'

type Handle = {|
  send(payload: Object): void,
  onMessage(callback: (message: Object) => void): void,
|}
type Options = {|
  timeout: number,
|}

class Communication {
  alive: boolean
  handle: Handle
  handlers: { [string]: Function } = {}
  outgoing: { [string]: { resolve: Function, reject: Function } } = {}
  constructor(handle: Handle, options: Options = { timeout: Infinity }) {
    invariant(typeof handle === 'object' && handle, 'handle must be a valid object')
    invariant(typeof handle.send === 'function', 'handle.send must be a valid function')
    invariant(typeof handle.onMessage === 'function', 'handle.onMessage must be a valid function')

    invariant(typeof options === 'object', 'options must be a valid object')
    invariant(typeof options.timeout === 'number' && options.timeout > -1, 'options.timeout must be a valid number')

    this.alive = true
    this.handle = handle

    this.handle.onMessage(message => {
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
    } while (!this.outgoing[id])
    return id
  }
  __handleMessage(message: Object) {
    if (message.type === 'request') {
      const response = {
        __sb_id: message.__sb_id,
        __sb_communication: true,
        successful: true,
        payload: undefined,
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
              this.handle.send(message)
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
      this.handlers[message.__sb_id] = { resolve, reject }
      this.handle.send(message)
    })
  }
  dispose() {
    this.alive = false
  }
}

export default Communication
