"use strinct";

const
  Handlebars = require('handlebars'),
  table = require('text-table'),
  _ = require('lodash')
  ;

class Report {

  constructor(mailtester) {
    this.mailtester = mailtester;
  }

  mailPlain() {
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

Hello, you recently sent a email for spam test, below are the test results.

FROM: {{doc.from}}
TO: {{doc.to}}
SUBJ: {{doc.subject}}
{{> spf doc.spf }}
{{> dkim doc.dkim.test }}
{{> blacklist doc.blacklist }}
{{> spamassassin doc.spamassassin }}

--------------------
Test id: {{doc._id}}

This is an automatically generated email
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

    let template = Handlebars.compile(source);
    let result = template(this.mailtester).trim();
    return result;
  }

}

module.exports.Report = Report;
