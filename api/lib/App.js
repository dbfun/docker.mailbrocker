const amqp = require('amqplib');
const { MongoClient } = require('mongodb');
const logger = require('log4js').getLogger();
const Security = require('./Security');

logger.level = 'debug';
logger.category = process.env.name;

class App {
  constructor(config) {
    this.config = config;
    this.security = new Security(config.securitySalt);
  }

  async connectMongo() {
    const client = new MongoClient(this.config.mongo.uri);
    await client.connect();

    this.mongo = client.db(this.config.mongo.db);
  }

  async connectRabbitMQ() {
    const conn = await amqp.connect(this.config.rabbitMQuri);

    logger.info('[AMQP] connected');

    conn.on('error', (err) => {
      if (err.message !== 'Connection closing') {
        logger.error('[AMQP] conn error', err.message);
      }
    });

    conn.on('close', () => {
      logger.error('[AMQP] reconnecting');
      setTimeout(this.connectRabbitMQ, 1000);
    });

    this.amqpConn = conn;

    await this.initRabbitMQ();
  }

  async initRabbitMQ() {
    const ch = await this.amqpConn.createConfirmChannel();
    ch.on('close', () => {
      logger.log('[AMQP] channel closed');
    });
    this.amqpChannel = ch;
    await this.amqpChannel.assertQueue('checkAll', { durable: true });
  }
}

module.exports = App;
