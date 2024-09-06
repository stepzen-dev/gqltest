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

exports.admin = admin;
exports.public = public;
exports.regular = regular;
