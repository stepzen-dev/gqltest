const gqltest = require("gqltest/packages/gqltest/gqltest.js");
const stepzen = require("gqltest/packages/gqltest/stepzen.js");

endpoint =
  "https://stepzen-chester.us-east-a.ibm.stepzen.net/examples/starwars/graphql";

describe("table-driven", function () {
  this.timeout(5000);
  this.slow(1000);

  // Note gqltest.runtests always adds in gqltest.logOnFail)
  // so no need to add it here.

  const tests = [
    {
      label: "query",
      query: "query {human(id:1001) {name}}",
      expected: {
        human: {
          name: "Darth Vader",
        },
      },
    },
    {
      label: "variables",
      query: "query ($id:ID!) {droid(id:$id) {name}}",
      variables: { id: 2001 },
      expected: {
        droid: {
          name: "R2-D2",
        },
      },
    },
    {
      label: "operationName",
      query: "query Episode($ep:Episode!) {hero(episode: $ep) {name}}",
      variables: { ep: "EMPIRE" },
      operationName: "Episode",
      expected: {
        hero: {
          name: "Luke Skywalker",
        },
      },
    },
    {
      // the request can be in its own object
      label: "request",
      request: {
        query: "query Episode($ep:Episode!) {hero(episode: $ep) {name}}",
        variables: { ep: "JEDI" },
        operationName: "Episode",
      },
      expected: {
        hero: {
          name: "R2-D2",
        },
      },
    },
  ];
  gqltest.runtests("starwars", endpoint, stepzen.public(), tests);
});
