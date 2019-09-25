var countColons = function (x) {
    var n = 0;
    x.replace(/:/g, function (c) { n++; });
    return n;
};

var padIPv6 = function (ip) {
    return ip
    .replace(/::/, function (two) {
        return ':' + Array((7 - countColons(ip)) + 1).join(':') + ':';
    })
    .split(':')
    .map(function (x) {
        return Array(4-x.length).fill('0').join("") + x;
    })
    .join(':');
};

module.exports = padIPv6;
