// Copyright IBM Corp. 2020, 2024

const fetch = require("node-fetch");
const chai = require("chai");
const chaiGraphQL = require("chai-graphql");
chai.use(chaiGraphQL);

class GQLHeaders {
  constructor() {
    this.headers = new Headers({
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

// Executes a GraphQL HTTP request against the endpoint returning the response and the body as JSON in GQLResponse.
// Sets: to allow access in afterEach.
// test.gql_start - time on entry
// test.gql_response - returned GQLResponse
async function execute({
  test,
  endpoint,
  request,
  method = "POST",
  headers = new GQLHeaders(),
}) {
  console.log("endpoint");
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

// Execute a GraphQL HTTP request requiring a 200 response and no errors.
// Optional validate the response.
async function executeOK({
  test,
  endpoint,
  request,
  method = "POST",
  headers = new GQLHeaders(),
  expected = undefined,
}) {
  response = await execute({ test, endpoint, request, method, headers });
  response.expectOK();
  if (expected) {
    chai.assert.graphQL(response.body, expected);
  }
  return response;
}

exports.execute = execute;
exports.executeOK = executeOK;
exports.GQLHeaders = GQLHeaders;
exports.GQLResponse = GQLResponse;
exports.logOnFail = logOnFail;
