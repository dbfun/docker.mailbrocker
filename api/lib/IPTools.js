const assert = require('assert');
const padIpv6 = require('pad-ipv6');

class IPTools {
  static IPver(ip) {
    return ip.match(/[0-9a-f:]{8,}/) ? 6 : 4;
  }

  static reverseIPv4(ip) {
    assert.ok(typeof ip === 'string');
    return ip.split('.').reverse().join('.');
  }

  static reverseIPv6(ip) {
    const ipV6Expanded = padIpv6(ip);
    return ipV6Expanded.replace(/:/g, '').split('').reverse().join('.');
  }
}

module.exports = IPTools;
