'use strict'

const EventEmitter = require('zm-event-kit').Emitter
class Communication extends EventEmitter {
  constructor(debug) {
    super()
    this.debug = debug
  }
  gotMessage(sendCallback, message) {
    if (!message.SB) return
    if (this.debug)
      console.debug(message)

    if (message.Genre === 'send') {
      message.response = null
      let response
      try  {
        this.emit(message.Type, message)
        response = message.response instanceof Promise ? message.response : Promise.resolve(message.response)
      } catch (err) {
        response = Promise.reject(err)
      }
      response.then(retVal => {
        sendCallback({Genre: 'response', Status: true, Result: retVal, ID: message.ID, SB: true})
      }, retVal => {
        if (retVal instanceof Error) {
          retVal = {stack: retVal.stack, message: retVal.message}
        }
        sendCallback({Genre: 'response', Status: false, Result: retVal, ID: message.ID, SB: true})
      })
    } else if(message.Genre === 'response') {
      this.emit(`JOB:${message.ID}`, message)
    }
  }
  request(sendCallback, type, message) {
    return new Promise((resolve, reject) => {
      const JobID = Communication.randomId()
      var disposable = this.on(`JOB:${JobID}`, function(Message){
        disposable.dispose()
        if (Message.Status) resolve(Message.Result)
        else reject(Message.Result)
      })
      sendCallback({Type: type, Genre: 'send', Message: message, SB : true, ID: JobID})
    })
  }
  static randomId() {
    return (Math.random().toString(36)+'00000000000000000').slice(2, 7+2)
  }
}
module.exports = Communication
