'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var EventEmitter = require('zm-event-kit').Emitter;

var Communication = (function (_EventEmitter) {
  _inherits(Communication, _EventEmitter);

  function Communication(debug) {
    _classCallCheck(this, Communication);

    _get(Object.getPrototypeOf(Communication.prototype), 'constructor', this).call(this);
    this.debug = debug;
  }

  _createClass(Communication, [{
    key: 'gotMessage',
    value: function gotMessage(sendCallback, message) {
      if (!message.SB) return;
      if (this.debug) console.debug(message);

      if (message.Genre === 'send') {
        message.response = null;
        var response = undefined;
        try {
          this.emit(message.Type, message);
          response = message.response instanceof Promise ? message.response : Promise.resolve(message.response);
        } catch (err) {
          response = Promise.reject(err);
        }
        response.then(function (retVal) {
          sendCallback({ Genre: 'response', Status: true, Result: retVal, ID: message.ID, SB: true });
        }, function (retVal) {
          if (retVal instanceof Error) {
            retVal = { stack: retVal.stack, message: retVal.message };
          }
          sendCallback({ Genre: 'response', Status: false, Result: retVal, ID: message.ID, SB: true });
        });
      } else if (message.Genre === 'response') {
        this.emit('JOB:' + message.ID, message);
      }
    }
  }, {
    key: 'request',
    value: function request(sendCallback, type, message) {
      var _this = this;

      return new Promise(function (resolve, reject) {
        var JobID = Communication.randomId();
        var disposable = _this.on('JOB:' + JobID, function (Message) {
          disposable.dispose();
          if (Message.Status) resolve(Message.Result);else reject(Message.Result);
        });
        sendCallback({ Type: type, Genre: 'send', Message: message, SB: true, ID: JobID });
      });
    }
  }], [{
    key: 'randomId',
    value: function randomId() {
      return (Math.random().toString(36) + '00000000000000000').slice(2, 7 + 2);
    }
  }]);

  return Communication;
})(EventEmitter);

module.exports = Communication;