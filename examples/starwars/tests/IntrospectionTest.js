const gqltest = require("../../../../gqltest/packages/gqltest/gqltest.js");
const stepzen = require("../../../../gqltest/packages/gqltest/stepzen.js");

const endpoint =
  "https://stepzen-chester.us-east-a.ibm.stepzen.net/examples/starwars/graphql";

describe("introspection", function () {
  this.timeout(5000);
  this.slow(1000);

  // Note gqltest.runtests always adds in gqltest.logOnFail)
  // so no need to add it here.
  gqltest.runtests("standard", endpoint, stepzen.public(), gqltest.introspectionTests);
  // public endpoint that doesn't have _service open.
  // gqltest.runtests("stepzen", endpoint, stepzen.public(), stepzen.introspectionTests);
});
