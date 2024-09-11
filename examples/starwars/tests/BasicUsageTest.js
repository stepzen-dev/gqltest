const gqltest = require("gqltest/packages/gqltest/gqltest.js");
const stepzen = require("gqltest/packages/gqltest/stepzen.js");

const endpoint =
  "https://stepzen-chester.us-east-a.ibm.stepzen.net/examples/starwars/graphql";

describe("basic-usage", function () {
  this.timeout(5000);
  this.slow(1000);

  // automatically logs the complete response when a test fails,
  // useful for debugging failures.
  afterEach("log-failure", gqltest.logOnFail);

  it("query", async function () {
    await gqltest.execute({
      test: this,
      endpoint,
      request: {
        query: "{hero {name}}",
      },
      expected: { hero: { name: "R2-D2" } },
      headers: stepzen.public,
    });
  });
  it("variables", async function () {
    await gqltest.execute({
      test: this,
      endpoint,
      request: {
        query: "query ($id:ID!) {human(id:$id) {name}}",
        variables: { id: 1000 },
      },
      expected: { human: { name: "Luke Skywalker" } },
      headers: stepzen.public,
    });
  });
  it("operationName", async function () {
    await gqltest.execute({
      test: this,
      endpoint,
      request: {
        query:
          "query Human($id:ID!) {human(id:$id) {name}} query Droid($id:ID!) {droid(id:$id) {name}}",
        variables: { id: 2000 },
        operationName: "Droid",
      },
      expected: { droid: { name: "C-3PO" } },
      headers: stepzen.public,
    });
  });
});
