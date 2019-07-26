"use strict";

/*

Registry for dependency injection

Usage:

const
  Registry = new (require('./lib/Registry').Registry)
  ;

// Service register
Registry.register('mongo', mongo);

// Service get
Registry.get('mongo');

*/

const registry = {};

class Registry {

  register(name, service) {
    if(registry[name]) throw new Error(`Registry ${name} already exists`);
    registry[name] = service;
  }

  get(name) {
    if(!registry[name]) throw new Error(`Registry ${name} not registered`);
    return registry[name];
  }

  unregister(name) {
    if(!registry[name]) throw new Error(`Registry ${name} not registered`);
    delete(registry[name]);
  }

}

module.exports.Registry = Registry;
