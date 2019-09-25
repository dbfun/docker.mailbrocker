var pad = require("./index");

var countColons = function (x) {
    var n = 0;
    x.replace(/:/g, function (c) { n++; });
    return n;
};

[
    ["fc00::",                  "fc00:0000:0000:0000:0000:0000:0000:0000"],
    ["fe80:685::ff:fe72:c4fa",  "fe80:0685:0000:0000:0000:00ff:fe72:c4fa"],
    ["::",                      "0000:0000:0000:0000:0000:0000:0000:0000"],
    ["::1",                     "0000:0000:0000:0000:0000:0000:0000:0001"],
].forEach(function (pair) {
    var input = pair[0];
    var expected = pair[1];

    var padded = pad(input);

    false && console.log({
        input: input,
        inputLength: input.length,
        inputColons: countColons(input),
        output: padded,
        outputLength: padded.length,
        outputColons: countColons(padded),
    });

    if (countColons(padded) !== 7) { throw new Error("Expected more colons"); }
    if (padded.length !== 39) { throw new Error("Expected a 39 character IP"); }
    if (padded !== expected) { throw new Error(padded + " !== " + expected); }
});


