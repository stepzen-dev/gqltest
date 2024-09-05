// Copyright IBM Corp. 2020, 2024

const fetch = require('node-fetch')
const {expect} = require('chai')

class GQLHeaders {
  constructor() {
    this.headers = new Headers({
      'Content-Type': 'application/json',
    })
  }
}

// Adds a HTTP header.
GQLHeaders.prototype.withHeader = function (key, value) {
  this.headers.set(key, value)
  return this
}

// Adds Authorization header using an api key (adminkey or apikey)
GQLHeaders.prototype.withAPIKey = function (apikey) {
  this.withHeader('Authorization', `apikey ${apikey}`)
  return this
}

// Adds Authorization header using a bearer token.
GQLHeaders.prototype.withToken = function (token) {
  this.withHeader('Authorization', `Bearer ${token}`)
  return this
}

// A full GraphQL HTTP response.
class GQLResponse {
  constructor(response, body) {
    this.response = response;
    this.body = body
  }
}

// Asserts that the GraphQL response has status 200 and no errors.
GQLResponse.prototype.expectOK = function () {
  expect(this.response.status).to.equal(200)
  expect(this.body.errors, 'no errors should exist').to.be.undefined
  return this
}


// Executes a GraphQL HTTP request against the endpoint returning the response and the body as JSON in GQLResponse.
async function execute(
  endpoint,
  request,
  method = 'POST',
  headers = new GQLHeaders(),
) {
  const response = await fetch(endpoint, {
    method: method,
    headers: headers.headers,
    body: JSON.stringify(request),
  })
  return new GQLResponse(response, await response.json());
}

exports.execute = execute
exports.GQLHeaders = GQLHeaders
exports.GQLResponse = GQLResponse
