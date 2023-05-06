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
  static register(name, service) {
    if (registry[name]) throw new Error(`Registry ${name} already exists`);
    registry[name] = service;
  }

  static get(name) {
    if (!registry[name]) throw new Error(`Registry ${name} not registered`);
    return registry[name];
  }

  static unregister(name) {
    if (!registry[name]) throw new Error(`Registry ${name} not registered`);
    delete (registry[name]);
  }
}

module.exports = Registry;
