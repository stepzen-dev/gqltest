const fs = require("fs");
const path = require("path");
const gqltest = require("../../../../gqltest/packages/gqltest/gqltest.js");
const stepzen = require("gqltest/packages/gqltest/stepzen.js");

endpoint =
  "https://stepzen-chester.us-east-a.ibm.stepzen.net/examples/starwars/graphql";

describe("table-driven-from-files", function () {
  this.timeout(5000);
  this.slow(1000);

  // Note gqltest.runtests always adds in gqltest.logOnFail)
  // so no need to add it here.

  const testfiles = ["starwars-requests.json", "introspection-requests.json"];
  testfiles.forEach(function (name) {
    gqltest.runtests(
      name,
      endpoint,
      stepzen.public(),
      path.join(__dirname, name)
    );
  });
});
