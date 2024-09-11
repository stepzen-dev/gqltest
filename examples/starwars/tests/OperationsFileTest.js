const fs = require("fs");
const path = require("path");
const gqltest = require("gqltest/packages/gqltest/gqltest.js");
const stepzen = require("gqltest/packages/gqltest/stepzen.js");

const endpoint =
  "https://stepzen-chester.us-east-a.ibm.stepzen.net/examples/starwars/graphql";

// Shows how operations can be loaded from a file and used in test cases.
const ops = fs.readFileSync(path.join(__dirname, "operations.graphql"), {
  encoding: "utf8",
});

describe("operations-from-file", function () {
  this.timeout(5000);
  this.slow(1000);

  // Note gqltest.runtests always adds in gqltest.logOnFail)
  // so no need to add it here.

  const tests = [
    {
      label: "Human",
      query: ops,
      operationName: "Human",
      variables: { id: 1000 },
      expected: {
        human: {
          name: "Luke Skywalker",
        },
      },
    },
    {
      label: "Droid",
      query: ops,
      operationName: "Droid",
      variables: { id: 2000 },
      expected: {
        droid: {
          name: "C-3PO",
        },
      },
    },
  ];
  gqltest.runtests("starwars", endpoint, stepzen.public(), tests);
});
