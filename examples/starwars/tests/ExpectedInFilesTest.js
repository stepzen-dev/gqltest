const path = require("path");
const gqltest = require("../../../../gqltest/packages/gqltest/gqltest.js");
const stepzen = require("gqltest/packages/gqltest/stepzen.js");

const endpoint =
  "https://stepzen-chester.us-east-a.ibm.stepzen.net/examples/starwars/graphql";

const expectedDir = path.join(__dirname, "expected");

describe("expected-from-files", function () {
  this.timeout(5000);
  this.slow(1000);

  // Note gqltest.runtests always adds in gqltest.logOnFail)
  // so no need to add it here.

  const tests = [
    {
      label: "human-1001",
      query: "query {human(id:1001) {name}}",
      expected: path.join(expectedDir, "human-1001.json"),
    },
    {
      label: "droid-2000",
      query: "query ($id:ID!) {droid(id:$id) {name}}",
      variables: { id: 2000 },
      expected: path.join(expectedDir, "droid-2000.json"),
    },
  ];
  gqltest.runtests("starwars", endpoint, stepzen.public(), tests);
});
