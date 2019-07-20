"use strict";


const
	assert = require('assert'),
	incomingMailPort = process.env.INCOMING_MAIL_PORT,
	config = {
		mongo: {
			uri: process.env.MONGO_URI,
			db: process.env.MONGO_DB,
			mailCollectionSize: parseInt(process.env.MONGO_MAIL_SIZE)
		}
	}
	;

class App {
	constructor() {
		return new Promise((appResolve, appReject) => {

			const init = async () => {
				await this.connectMongo();
				await this.initMongo();
				appResolve(this);
			}

			init().catch(err => {
				console.log(err);
		    appReject(err);
		  });

		});
	}

	connectMongo() {
		const
			mongodb = require('mongodb'),
			MongoClient = mongodb.MongoClient
			;

	  return new Promise((resolve, reject) => {
	    MongoClient.connect(config.mongo.uri, { useNewUrlParser: true }, (err, db) => {
	      assert.equal(null, err);
				this.mongo = db.db(config.mongo.db);
	      resolve();
	    });
	  });
	}

	initMongo() {
		return new Promise((resolve, reject) => {
			this.mongo.createCollection("mails", { capped: true, size: config.mongo.mailCollectionSize}).then(() => {
				resolve();
			}).catch(e => {
				reject();
			});
		});
	}

	runIncomingMailServer() {
		const
			express = require('express'),
			bodyParser = require('body-parser'),
		  app = express()
			;

		app.use(bodyParser.text({limit: '5mb', type: 'text/plain'}));

		app.post('/checkmail', (req, res) => {

			this.mongo.collection('mails').insertOne({done: false, raw: req.body}).then((doc) => {
				res.setHeader('Content-Type', 'application/json');
				res.send(JSON.stringify({result: "ok"}));
			}).catch(err => {
				res.status(500);
				res.setHeader('Content-Type', 'application/json');
				res.send(JSON.stringify({result: "fail"}));
			});

    });

		app.listen(incomingMailPort);
	}
}

var app = new App();
app.then((app) => {
	app.runIncomingMailServer();
});

