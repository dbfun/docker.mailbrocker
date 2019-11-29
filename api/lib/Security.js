"use strinct";

const
  sha1 = require('sha1'),
  Url = require('url-parse')
  ;

class Security {

  constructor(salt) {
    this.salt = salt;
  }

  sign(msg) {
    return sha1(msg + this.salt);
  }

  check(msg, sign) {
    return this.sign(msg) === sign;
  }

  signUri(originUri) {
    let url = new Url(originUri, true);
    url.query.sign = this.getUrlSign(url);
    return url.toString();
  }

  isUriValid(signedUri) {
    let url = new Url(signedUri, true);
    let sign1 = url.query.sign;
    delete url.query.sign;
    let sign2 = this.getUrlSign(url);
    return sign1 === sign2;
  }

  getUrlSign(url) {
    return this.sign(url.pathname + url.query);
  }


}

module.exports.Security = Security;
