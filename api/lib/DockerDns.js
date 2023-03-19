"use strict";

const { Resolver } = require('node:dns').promises;
const resolver = new Resolver();

let expected = '127.0.0.11';
let actual = resolver.getServers()[0];

let isDockerDns = expected === actual;

if(!isDockerDns) {
    console.warn(`Unexpected Docker DNS resolver. Expected ${expected}, received ${actual}`);
}

class DockerDns {

    static async resolve()
    {
        return await resolver.resolve4('dns');
    }

}

module.exports.DockerDns = DockerDns;
