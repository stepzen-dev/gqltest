const { execSync } = require("child_process");

const { GQLHeaders } = require("./gqltest.js");

// assumption is that when testing against a StepZen instance the user is logged in.
// For CI-CD see https://github.com/stepzen-dev/stepzen-login
const adminKey = execSync(`stepzen whoami --adminkey`).toString().trim();
const apiKey = execSync(`stepzen whoami --apikey`).toString().trim();

// Returns GQLHeaders using the admin key.
function admin() {
  return new GQLHeaders().withAPIKey(adminKey);
}

// Returns GQLHeaders using the apikey key.
function regular() {
  return new GQLHeaders().withAPIKey(apiKey);
}

// Returns GQLHeaders using the no authorization.
function public() {
  return new GQLHeaders();
}

// introspection tests is a collection of tests ensuring that introspection capabilities work.
// The requests are invoked but no expected data.
const introspectionTests = [
  {
    // By default StepZen endpoints are setup for Apollo Federation.
    label: 'federation-service',
    query: '{_service { sdl }}',
  },
]

exports.admin = admin;
exports.public = public;
exports.regular = regular;
exports.introspectionTests = introspectionTests;
