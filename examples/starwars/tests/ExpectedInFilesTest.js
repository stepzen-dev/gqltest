const path = require("path");
const gqltest = require("gqltest/packages/gqltest/gqltest.js");
const stepzen = require("gqltest/packages/gqltest/stepzen.js");

const endpoint =
  "https://stepzen-chester.us-east-a.ibm.stepzen.net/examples/starwars/graphql";

// directory for expected files.
// If this is passed in as `expected` for a test then
// the test label (or title) with suffix `.json` is used
// as the expected file name within the directory.
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
      // explicit path the the expected file
      expected: path.join(expectedDir, "human-1001.json"),
    },
    {
      label: "droid-2000",
      query: "query ($id:ID!) {droid(id:$id) {name}}",
      variables: { id: 2000 },
      // ${label}.json in expectedDir will be the expected file.
      expected: path.join(expectedDir),
    },
    {
      // expected has the full response including "data"
      label: "human-1003-full",
      query:
        "query ($id:ID!) {human(id:$id) {id name homePlanet friends @sort {name}}}",
      variables: { id: 1003 },
      expected: path.join(expectedDir),
    },
  ];
  gqltest.runtests("starwars", endpoint, stepzen.public(), tests);
});
