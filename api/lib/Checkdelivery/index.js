"use strict";

const
  assert = require("assert"),
  imaps = require("imap-simple"),
  EventEmitter = require("events"),
  maxDelayMs = 1 * 3600 * 1000
  ;

assert.ok(process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0" || process.env.NODE_EXTRA_CA_CERTS !== "", "Specify NodeJS env variables: `NODE_TLS_REJECT_UNAUTHORIZED` or `NODE_EXTRA_CA_CERTS`");

class Checkdelivery {

  static watchAll(mailboxes) {
    return new Promise(async (resolve, reject) => {
      mailboxes = mailboxes.filter((o) => {
        return o.active === true;
      });
      if(!mailboxes.length) {
        reject("No active mails");
        return;
      }
      let generalEmitter = new EventEmitter;
      let checkdeliveryList = [];

      for(let mailbox of mailboxes) {
        try {
          let checkdelivery = new Checkdelivery(mailbox);
          let emitter = checkdelivery.emitter;

          await checkdelivery.connect();
          checkdelivery.startWatch();
          checkdeliveryList.push(checkdelivery);
          emitter.on("result", (data) => {
            data.mailbox = mailbox.info;
            generalEmitter.emit("result", data);
          });

        } catch (e) {
          console.log(e);
        }
      }

      generalEmitter.on("stopWatch", () => {
        for(let checkdelivery of checkdeliveryList) {
          checkdelivery.stopWatch();
          checkdelivery.disconnect();
        }
      });

      resolve(generalEmitter);
    });
  }

  constructor(mailbox) {
    this.mailbox = mailbox;
    this.connection = null;
    this.emitter = new EventEmitter;
    this.loopCnt = 0;
    this.lettersById = {};
    this.isWatching = false;
    this.test = {
      result: null,
      report: {
        spam: null,
        ham: null
      },
      errors: []
    };
  }

  async connect() {
    let connection = await imaps.connect( { imap: this.mailbox.imap } );
    if(connection.imap.state !== "authenticated") {
      await connection.end();
      throw Error("Connection not authenticated");
    }
    this.connection = connection;
    return connection;
  }

  async disconnect() {
    if(this.connection) {
      console.log(`disconnect: ${this.mailbox.info.name}`);
      await this.connection.end();
    }
  }

  startWatch() {
    this.isWatching = true;
    this.watch();
  }

  stopWatch() {
    this.isWatching = false;
  }

  async watch() {
    if(!this.isWatching) return;
    this.loopCnt++;
    // console.log(`watch... ${this.loopCnt}`);
    await this.getLast();
    await this.sleep(1000);
    this.watch();
  }

  async getLast() {
    this.lettersById = {};
    let sinceDate = new Date();
    sinceDate.setTime(Date.now() - maxDelayMs);
    sinceDate = sinceDate.toISOString();
    await this.getMails(sinceDate);
    this.processResults();
  }

  async getMails(sinceDate) {
    for(let boxName in this.mailbox.box) {
      let boxType = this.mailbox.box[boxName];

      try {
        await this.ckeckBox(boxName, boxType, sinceDate);
      } catch (e) {
        if(/SELECT No such folder/.test(e.message)) {
          try {
            let boxes = await this.connection.getBoxes();
            console.log(`${e.message}\nError box: "${boxName}"\nNotice: available boxes: ${Object.keys(boxes)}`);
          } catch (e) { }
        } else {
          console.log(e.message);
        }

      }
    }

  }

  processResults() {
    for(let _id in this.lettersById) {
      let report = this.lettersById[_id];

      switch(true) {
        case report.spam >= 1 && report.ham === 0:
          this.emitter.emit("result", { _id: _id, result: "spam", report: report });
          break;
        case report.ham >= 1 && report.spam === 0:
          this.emitter.emit("result", { _id: _id, result: "ham", report: report });
          break;
        case report.spam >= 1 && report.ham >= 1:
          this.emitter.emit("result", { _id: _id, result: "few mails", report: report });
          break;
      }
    }

  }

  async ckeckBox(boxName, boxType, sinceDate) {
    await this.connection.openBox(boxName);

    let results = await this.connection.search(
      [
        'UNSEEN', ['SINCE', sinceDate]
      ],
      { bodies: ['HEADER'], markSeen: true }
    );

    results.forEach((o) => {
      try {
        let headers = o.parts.filter((o) => {
          return o.which === "HEADER";
        });
        let _id = headers[0].body["x-mailtester"]
        if(!_id) return;
        if(!this.lettersById.hasOwnProperty(_id)) {
          this.lettersById[_id] = {
            ham: 0,
            spam: 0
          };
        }
        this.lettersById[_id][boxType]++;
      } catch (e) { }
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

}


module.exports.Checkdelivery = Checkdelivery;
