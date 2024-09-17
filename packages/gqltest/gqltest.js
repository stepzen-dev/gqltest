// Copyright IBM Corp. 2020, 2024

const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const chai = require("chai");
const chaiGraphQL = require("chai-graphql");
chai.use(chaiGraphQL);

const {introspectionTests} = require("./_introspection.js");

// GQLHeaders holds headers for a request.
//
// Default Accept and Content-Type (assuming POST requests) are added.
//
// The environment variable GQLTEST_HEADERS can be used
// to add to headers during the constructor.
//
// GQLTEST_HEADERS='{"X-Trace": "abc"}' npm test
class GQLHeaders {
  constructor() {
    this.headers = new Headers({
      // Prefer new style GraphQL over HTTP response content type.
      Accept: "application/graphql-response+json,application/json;q=0.8",
      "Content-Type": "application/json",
    });
    if (process.env.GQLTEST_HEADERS) {
      for (let [name,value] of Object.entries(JSON.parse(process.env.GQLTEST_HEADERS))) {
        this.headers.set(name, value);
      }
    }
  }
}

// Adds a HTTP header.
GQLHeaders.prototype.withHeader = function (key, value) {
  this.headers.set(key, value);
  return this;
};

// Adds Authorization header using an api key (adminkey or apikey)
GQLHeaders.prototype.withAPIKey = function (apikey) {
  this.withHeader("Authorization", `apikey ${apikey}`);
  return this;
};

// Adds Authorization header using a bearer token.
GQLHeaders.prototype.withToken = function (token) {
  this.withHeader("Authorization", `Bearer ${token}`);
  return this;
};

// A full GraphQL HTTP response.
class GQLResponse {
  constructor(response, body) {
    this.response = response;
    this.body = body;
  }
}

// Asserts that the GraphQL response has status 200 and no errors.
GQLResponse.prototype.expectOK = function () {
  chai.expect(this.response.status).to.equal(200);
  return this;
};


// defaultTimeout can be used in describe.timeout()
// for requests against a graphql endpoint.
// Match stepzen AWS 60 second timeout.
const defaultTimeout = 60000

function testDescription(testRoot, fullDirName) {
  segments = fullDirName.split(path.sep)
  rootIndex = segments.findIndex(element => element == testRoot)
  // Construct the test description from the unique path from testRoot, which is likely the root of the git repo.
  // Intentionally not using `path.sep` as this is not a path to a file now, but a test description.
  return segments.slice(rootIndex + 1, -1).join('/')
}

async function _execute({
  test,
  endpoint,
  request,
  method = "POST",
  headers = new GQLHeaders(),
}) {
  if (headers instanceof Function) {
    headers = headers();
  }
  test.gql_start = new Date();
  const response = await fetch(endpoint, {
    method: method,
    headers: headers.headers,
    body: JSON.stringify(request),
  });
  test.gql_response = new GQLResponse(response, await response.json());
  return test.gql_response;
}

// Logs information about a request on a failure.
function logOnFail() {
  if (this.currentTest.state === "passed") {
    return;
  }

  if (this.gql_start) {
    console.log("START: ", this.gql_start.toISOString());
    console.log("END:   ", new Date().toISOString());
  }

  if (this.gql_response) {
    console.log("HTTP status: ", this.gql_response.response.status);
    console.log("HTTP response: ", JSON.stringify(this.gql_response.body));
  }
}

// Executes a GraphQL HTTP request against the endpoint returning the response and the body as JSON in GQLResponse.
// Sets: to allow access in afterEach.
// test.gql_start - time on entry
// test.gql_response - returned GQLResponse
//
// headers is optional but is expected to be an instance of GQLHeaders or a function returning an instance of GQLHeaders.

// A status code of 200 is required.
// Expected is compared to the response body.
async function execute({
  test,
  endpoint,
  request,
  method = "POST",
  headers = new GQLHeaders(),
  expected = undefined,
}) {
  response = await _execute({ test, endpoint, request, method, headers });
  response.expectOK();
  if (expected) {
    assertExpected(response, expected, test.gql_title);
  }
  return response;
}

// assertExpected supports these values for expected:
// For example with this response:
//
// (1) value rooted at `data`: {customer: {name: "Fred"}}
// (2) root value with no errors: {data: {customer: {name: "Fred"}}}
// (3) root value with field errors: {data: {customer: {name: "Fred" email:null}}, "errors":[...]}
//     or or request errors: {"errors":[...]}
//
// Workarounds for (1) if "data" or "errors" are the root fields under "data" in a response:
//  - use approach (2)
//  - use aliases in request: {d:data e:errors}
function assertExpected(response, expected, label) {
  expected = optionalJSONFromFile(expected, label);

  // (2),(3) - Response at the root.
  if ( Object.hasOwn(expected, "data") || Object.hasOwn(expected, "errors")) {
    chai.expect(response.body).to.deep.equal(expected);
    return;
  }

  // (1) - Non-error response rooted at data.
  chai.assert.graphQL(response.body, expected);
}

// List/Table driven testing using mocha.
// The GraphQL request parameters can be provided in request as an object
// or as individual values.
// These are identical:
// {label:'tn', request: {query:"{__typename"}}
// {label:'tn', query:"{__typename"}}
//
// request takes precedence.
// name is an alternative to label for the test name.
//
// If tests is a string then it is assumed to be a file
// name containing JSON representing a list of tests.
async function runtests(label, endpoint, headers, tests) {
  try {
    tests = optionalJSONFromFile(tests);
  } catch (err) {
    describe(`load-failed: ${tests}`, function () {
      it("error", function () {
        chai.expect.fail(err.toString());
      });
    });
    return;
  }

  describe(label, function () {
    this.timeout(defaultTimeout) // Occasional requests take > 2s
    beforeEach("test-info", function() {
      this.gql_title = this.currentTest.title;
    })
    afterEach("log-failure", logOnFail);
    tests.forEach(
      ({
        label,
        name,
        request,
        documentId,
        query,
        variables,
        operationName,
        expected,
      }) => {
        if (!label) {
          label = name;
        }
        it(label, async function () {
          if (!request) {
            request = {};
            if (documentId) {
              request.documentId = documentId;
            }
            if (query) {
              request.query = query;
            }
            if (operationName) {
              request.operationName = operationName;
            }
            if (variables) {
              request.variables = variables;
            }
          }
          return await execute({
            test: this,
            endpoint: endpoint,
            headers: headers,
            request: request,
            expected: expected,
          });
        });
      }
    );
  });
}

// optional loads a value from a file and parse as JSON if it is a string.
// If value is a directory then the file loaded is `value/label` where
// label is intended to be the test label.
function optionalJSONFromFile(value, label) {
  if (typeof value != "string") {
    return value;
  }
  if (label && fs.statSync(value).isDirectory()) {
    value = path.join(value, `${label}.json`)
  }
  return JSON.parse(fs.readFileSync(value, { encoding: "utf-8" }));
}

exports.execute = execute;
exports.runtests = runtests;
exports.GQLHeaders = GQLHeaders;
exports.GQLResponse = GQLResponse;
exports.logOnFail = logOnFail;
exports.introspectionTests = introspectionTests;
exports.defaultTimeout = defaultTimeout
exports.testDescription = testDescription;
