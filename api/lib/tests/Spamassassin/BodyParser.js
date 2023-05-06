class BodyParser {
  constructor(body) {
    this.body = body;
  }

  score() {
    const m = this.body.match(/Content\s+analysis\s+details:\s+\(([0-9.-]+)\s+points/);
    return m ? parseFloat(m[1]) : null;
  }

  rules() {
    const rulesBody = this.body.match(/(?:-{1,}\s+-{3,}\s+-{3,})\n(.*)(?:\r\n|\r|\n)$/ms)[1];

    const lines = rulesBody.split(/\n/g);
    const rules = [];
    let buff = '';

    while (true) {
      const line = lines.shift();

      if (line === undefined) {
        BodyParser.addRule(rules, buff);
        break;
      }

      if (line.match(/^\s[0-9]\.[0-9]/)) {
        BodyParser.addRule(rules, buff);
        buff = line;
      } else {
        buff += ` ${line.trim()}`;
      }
    }

    return rules;
  }

  static addRule(rules, _rule) {
    const rule = _rule.trim();
    if (!rule) {
      return;
    }

    const m = rule.match(/^([0-9.]+)\s+([a-z_]+)\s+(.*)$/i);

    rules.push({
      score: parseFloat(m[1]),
      name: m[2],
      description: m[3].trim(),
    });
  }
}

module.exports = BodyParser;
