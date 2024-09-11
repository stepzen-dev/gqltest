// Copyright IBM Corp. 2020, 2024

const fs = require("fs");
const fetch = require("node-fetch");
const chai = require("chai");
const chaiGraphQL = require("chai-graphql");
const { setHeapSnapshotNearHeapLimit } = require("v8");
chai.use(chaiGraphQL);

class GQLHeaders {
  constructor() {
    this.headers = new Headers({
      "Accept": "application/json",
      "Content-Type": "application/json",
    });
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
  chai.assert.notGraphQLError(this.body);
  return this;
};


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
    assertExpected(response, expected);
  }
  return response;
}

function assertExpected(response, expected) {
  expected = optionalJSONFromFile(expected);
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
async function runtests(label, endpoint, headers, tests) {
  try {
    tests = optionalJSONFromFile(tests);
  } catch (err) {
    describe(`load-failed: ${tests}`, function() {
      it('error', function() {
        chai.expect.fail(err.toString())
      })
  });
  return
}
  

  describe(label, function() {
    afterEach('log-failure', logOnFail)
      tests.forEach(
        ({ label, name, request ,documentId, query, variables, operationName, expected }) => {
          if (!label) {
            label = name;
          }
          it(label, async function () {
            if (!request) {
              request = {}
              if (documentId) {
                request.documentId = documentId
              }
              if (query) {
                request.query = query
              }
              if (operationName) {
                request.operationName = operationName
              }
              if (variables) {
                request.variables = variables
              }
            }
            return await execute({
              test: this,
              endpoint: endpoint,
              headers: headers,
              request: request,
              expected: expected,
            }
            );
          });
        }
      );
    })

}

// optional loads a value from a file and parse as JSON if it is a string.
function optionalJSONFromFile(value) {
  if (typeof(value) != "string") {
    return value
  }
  return JSON.parse(fs.readFileSync(value, {encoding: 'utf-8'}));
}

exports.execute = execute;
exports.runtests = runtests;
exports.GQLHeaders = GQLHeaders;
exports.GQLResponse = GQLResponse;
exports.logOnFail = logOnFail;
