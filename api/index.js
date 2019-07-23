"use strict";


const
	assert = require('assert'),
	config = {
		incomingMailPort: process.env.PORT_API,
		incomingMailMaxSize: process.env.API_INCOMING_MAIL_MAX_SIZE,
		spamassassin: {
			port: process.env.PORT_SPAMASSASSIN,
			maxSize: process.env.SPAMASSASSIN_MAX_MSG_SIZE
		},
		mongo: {
			uri: process.env.MONGO_URI,
			db: process.env.MONGO_DB,
			mailCollectionSize: parseInt(process.env.MONGO_MAIL_SIZE)
		}
	}
	;

class Api {
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

	run() {
		const
			express = require('express'),
			bodyParser = require('body-parser'),
		  api = express(),
			Mailtester = require('./lib/Mailtester')(config)
			;

		api.use(bodyParser.text({limit: config.incomingMailMaxSize, type: 'text/plain'}));

		api.use(function(req, res, next) {
		  res.setHeader('Content-Type', 'application/json');
		  next();
		});

		api.get('/healthcheck', async (req, res) => {
			res.send(JSON.stringify({result: "ok"}));
		});

		api.post('/checkmail', async (req, res) => {
			// res.status(404).send('Temp error'); return; // Error test case
			let mailtester = new Mailtester(req.body, this.mongo.collection('mails'));
			try {
				await mailtester.saveRaw();
				res.send(JSON.stringify({result: "ok"}));
				try {
					await mailtester.checkAll();
					await mailtester.saveResults();
				} catch (e) {

				}
			} catch (err) {
				console.log(err);
				res.status(500);
				res.send(JSON.stringify({result: "fail"}));
			}
    });

		api.use(function(req, res, next) {
	    res.status(404).send('Wrong API URI');
	  });

	  api.use(function(err, req, res, next) {
	    console.log(err);
	    if (req.xhr) {
	      res.status(500).send({ error: err.message ? err.message : 'Произошла ошибка сервера API' });
	    } else {
	      next(err);
	    }
	  });

		api.listen(config.incomingMailPort);
		console.log(`API is listening port ${config.incomingMailPort}`);
	}
}

var api = new Api();
api.then((api) => {
	api.run();
});
