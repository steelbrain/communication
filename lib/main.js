'use strict';
'use babel';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _sbEventKit = require('sb-event-kit');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Communication = function () {
  function Communication(debug) {
    var _this = this;

    _classCallCheck(this, Communication);

    this.debug = Boolean(debug);
    this.emitter = new _sbEventKit.Emitter();
    this.subscriptions = new _sbEventKit.CompositeDisposable();

    this.emitter.on('request', function (message) {
      message.response = null;

      var response = new Promise(function (resolve) {
        _this.emitter.emit('request:' + message.name, message.data, message);
        resolve(message.response);
      });

      response.then(function (response) {
        message.response = response;
        return true;
      }, function (val) {
        if (val instanceof Error) {
          var error = { __sb_is_error: true };
          Object.getOwnPropertyNames(val).forEach(function (key) {
            error[key] = val[key];
          });
          message.response = error;
        } else message.response = val;
        return false;
      }).then(function (status) {
        _this.emitter.emit('send', {
          id: message.id, sb_communication: true, status: status, type: 'response', data: message.response
        });
      });
    });
    this.emitter.on('response', function (message) {
      message.data = message.data && message.data.__sb_is_error ? Communication.createError(message.data) : message.data;
      _this.emitter.emit('job:' + message.id, message);
    });
  }

  _createClass(Communication, [{
    key: 'parseMessage',
    value: function parseMessage(messageGiven) {
      var message = void 0;
      try {
        message = typeof messageGiven === 'string' ? JSON.parse(messageGiven) : messageGiven;
      } catch (_) {
        throw new Error('Error decoding response');
      }
      if (!message.sb_communication) {
        // Ignore unknown messages
        return;
      }
      if (this.debug) {
        console.debug(message);
      }
      this.emitter.emit(message.type, message);
    }
  }, {
    key: 'request',
    value: function request(name) {
      var _this2 = this;

      var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return new Promise(function (resolve, reject) {
        var id = Communication.randomId();
        var disposable = _this2.emitter.on('job:' + id, function (result) {
          disposable.dispose();
          if (result.status) {
            resolve(result.data);
          } else reject(result.data);
        });
        _this2.emitter.emit('send', {
          id: id, sb_communication: true, name: name, type: 'request', data: data
        });
      });
    }
  }, {
    key: 'onRequest',
    value: function onRequest(name, callback) {
      return this.emitter.on('request:' + name, callback);
    }
  }, {
    key: 'onShouldSend',
    value: function onShouldSend(callback) {
      return this.emitter.on('send', callback);
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this.subscriptions.dispose();
      this.emitter.dispose();
    }
  }], [{
    key: 'randomId',
    value: function randomId() {
      return (Math.random().toString(36) + '00000000000000000').slice(2, 7 + 2);
    }
  }, {
    key: 'createError',
    value: function createError(data) {
      var error = new Error();
      for (var key in data) {
        if (key !== '__sb_is_error') {
          error[key] = data[key];
        }
      }
      return error;
    }
  }]);

  return Communication;
}();

exports.default = Communication;