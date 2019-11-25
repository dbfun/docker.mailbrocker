"use strinct";

const
  Handlebars = require('handlebars')
  ;

class Report {

  constructor(mailtester) {
    this.mailtester = mailtester;
  }

  mailPlain() {
    let source = `
Hello, your spam score is {{doc.spamassassin.test.score}}.

Spamassassin rules:

{{#each doc.spamassassin.test.rules}}
score: {{this.score}}
name: {{this.name}}
description: {{this.description}}

{{/each}}
`;
    let template = Handlebars.compile(source);

    let result = template(this.mailtester).trim();
    return result;
  }

}


module.exports.Report = Report;
