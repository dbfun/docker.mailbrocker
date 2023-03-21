"use strict";

const logger = require("log4js").getLogger();
const fs = require("fs");
const envfile = require("envfile");
const crypto = require("crypto");
const secretsFile = "/etc/api/secrets.env";

logger.level = "debug";
logger.category = "Init";

const initSecretsFile = () => {

    if (fs.existsSync(secretsFile)) {
        logger.info(`The application has already created a secrets file, skip`);
        return;
    }

    let secrets = {
        SECURITY_SALT: crypto.randomBytes(16).toString("hex")
    };

    fs.writeFileSync(secretsFile, envfile.stringify(secrets));

    logger.info(`Configuration file successfully created`);

}

module.exports.initSecretsFile = initSecretsFile;