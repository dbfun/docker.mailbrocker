"use strict";

const
  assert = require("assert"),
  amqp = require("amqplib")
  ;

class App {

  constructor(config) {
    this.config = config;
  }

  async connectMongo() {
    const
      mongodb = require("mongodb"),
      MongoClient = mongodb.MongoClient
      ;

    return new Promise((resolve, reject) => {
      MongoClient.connect(this.config.mongo.uri, {
          useNewUrlParser: true,
          keepAlive: 1,
          connectTimeoutMS: 5000
        }, (err, db) => {
        assert.equal(null, err);
        this.mongo = db.db(this.config.mongo.db);
        resolve();
      });
    });
  }

  async connectRabbitMQ() {
    let conn = await amqp.connect(this.config.rabbitMQuri);

    conn.on("error", (err) => {
      if (err.message !== "Connection closing") {
        console.error("[AMQP] conn error", err.message);
      }
    });

    conn.on("close", () => {
      console.error("[AMQP] reconnecting");
      setTimeout(this.connectRabbitMQ, 1000);
    });

    this.amqpConn = conn;

    await this.initRabbitMQ();
  }

  async initRabbitMQ() {
    let ch = await this.amqpConn.createConfirmChannel();
    ch.on("close", () => {
      console.log("[AMQP] channel closed");
    });
    this.amqpChannel = ch;
    await this.amqpChannel.assertQueue("checkAll", { durable: true });
  }

}

module.exports.App = App;