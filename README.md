SB-Communication
================

SB-Communication is a base communication low-level library meant to be used in other communication libraries.
It allows promise-based communication on both ends, You must write a wrapper for it for your use-case specific
stream, socket or resource though. It works in both browsers and node!

#### Example Communication Implementation

```js
'use babel'

import Communication from 'sb-communication'

const worker = new WebWorker('worker.js')

const communication = new Communication({
  listener(callback) {
    worker.onmessage = callback
  },
  send(data) {
    worker.postMessage = data
  },
})

// Event-Specific bindings
communication.on('count-pi', async function(data) {
  // ^ Handlers can return Promises or be sync
  console.log(data)
  return 'Something else'
})
```

#### API

```js
export default class Communication {
  constructor({ listener: Function, send: Function })
  on(event, callback)
  send(event, payload)
  dispose()
}
```

#### LICENSE

This project is licensed under the terms of MIT License.
