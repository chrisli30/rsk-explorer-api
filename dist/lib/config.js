'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _config = require('../../config.json');

var _config2 = _interopRequireDefault(_config);

var _defaultConfig = require('./defaultConfig');

var _defaultConfig2 = _interopRequireDefault(_defaultConfig);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const keys = Object.keys(_defaultConfig2.default);

for (let key of keys) {
  _config2.default[key] = _config2.default[key] || _defaultConfig2.default[key];
  for (let p in _defaultConfig2.default[key]) {
    if (!_config2.default[key][p]) _config2.default[key][p] = _defaultConfig2.default[key][p];
  }
}
// defaults  servers/ports
_config2.default.erc20.node = _config2.default.erc20.node || _config2.default.source.node;
_config2.default.erc20.port = _config2.default.erc20.port || _config2.default.source.port;

_config2.default.blocks.node = _config2.default.blocks.node || _config2.default.source.node;
_config2.default.blocks.port = _config2.default.blocks.port || _config2.default.source.port;

exports.default = _config2.default;