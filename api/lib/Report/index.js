"use strinct";

const
  Handlebars = require('handlebars'),
  table = require('text-table'),
  _ = require('lodash')
  ;

class Report {

  constructor(mailbroker, security) {
    this.mailbroker = mailbroker;
    this.security = security;
  }

  mailPlain(config) {
    Handlebars.registerPartial("spf", `
{{#this}}

============
SPF
============

Result: {{this.test.[Response result]}}
Description: {{this.test.spfquery}}
{{/this}}
`.trim());

    Handlebars.registerPartial("dkim", `
{{#this}}

============
DKIM
============

{{#if this.[originator address]}}
Originator address: {{this.[originator address]}}
{{/if}}
{{#if this.[sender policy result
]}}Sender policy result: {{this.[sender policy result]}}
{{/if}}
{{#if this.[author policy result
]}}Author policy result: {{this.[author policy result]}}
{{/if}}
{{#if this.[ADSP policy result
]}}ADSP policy result: {{this.[ADSP policy result]}}
{{/if}}
{{#if this.[signature identity]}}
Signature identity: {{this.[signature identity]}}
{{/if}}
{{#if this.[verify result]}}
Verify result: {{this.[verify result]}}
{{/if}}
{{/this}}
`.trim());

    Handlebars.registerPartial("blacklist", `
{{#this}}

============
Blacklist
============

{{#if blackListed}}
Your IP is blacklisted: {{ip}}

{{#each this.blackListed}}
* {{this}}
{{/each}}
{{else}}
Your IP is not blacklisted: {{ip}}
{{/if}}
{{/this}}
`.trim());

    Handlebars.registerPartial("spamassassin", `
{{#this}}

============
Spamassassin
============

Score: {{this.test.score}}
{{#this.test.rules}}
Rules:

{{{plaintable this}}}
{{/this.test.rules}}
{{/this}}
`.trim());

    let source = `
=================
Your mail results
=================

Hello! Recently you sent an email for spam test, the test results are given below

FROM: {{doc.from}}
TO: {{doc.to}}
SUBJ: {{doc.subject}}
{{> spf doc.spf }}
{{> dkim doc.dkim.test }}
{{> blacklist doc.blacklist }}
{{> spamassassin doc.spamassassin }}

--------------------
Test id: {{doc._ObjectId}}

This is an automatically generated email
To unsubscribe from any emails click here: {{{unsubscribe doc._ObjectId}}}
`;

    Handlebars.registerHelper('plaintable', rules => {
      let data = [ [] ];
      try {
        data = _.values(_.mapValues(rules, (o) => {
          return _.values(o);
        }));
      } catch (e) { }
      return table(data);
    });

    Handlebars.registerHelper('unsubscribe', _id => {
      let uri = `${config.baseHref}/unsubscribe?type=mongo&collection=mails&_id=${_id}`;
      uri = this.security.signUri(uri);
      return uri;
    });

    let template = Handlebars.compile(source);
    let result = template(this.mailbroker).trim();
    return result;
  }

}

module.exports.Report = Report;
