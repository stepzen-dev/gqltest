const { execSync } = require("child_process");
const graphql = require("graphql");
const {
  GQLHeaders,
  runtests,
  instrospectionTests: gqlIntrospectionTests,
} = require("./gqltest.js");

// assumption is that when testing against a StepZen instance the user is logged in.
// For CI-CD see https://github.com/stepzen-dev/stepzen-login

// Returns GQLHeaders using the admin key.
function admin() {
  return new GQLHeaders().withAPIKey(
    execSync(`stepzen whoami --adminkey`).toString().trim(),
  );
}

// Returns GQLHeaders using the apikey key.
function regular() {
  return new GQLHeaders().withAPIKey(
    execSync(`stepzen whoami --apikey`).toString().trim(),
  );
}

// Returns GQLHeaders using the no authorization.
function public() {
  return new GQLHeaders();
}

// Returns GQLHeaders using the access token key.
function token() {
  return new GQLHeaders().withToken(
    execSync(`stepzen whoami --accesstoken`).toString().trim(),
  );
}

// introspection tests is a collection of tests ensuring that introspection capabilities work.
// The requests are invoked but no expected data.
// The returned set should be tested in addition to gqltest.introspectionTests
// and can be doen using stepzen.runIntrospectionTests.
const introspectionTests = [
  {
    // By default StepZen endpoints are setup for Apollo Federation.
    label: "federation-service",
    query: "{_service { sdl }}",
  },
  {
    // Introspection operation with October 2021 additions
    label: "introspection-october-2021",
    query: graphql.getIntrospectionQuery({
      specifiedByUrl: true,
      directiveIsRepeatable: true,
      schemaDescription: true,
    }),
  },
  {
    // Introspection operation with all StepZen's currently supported capabilities
    label: "introspection-current",
    query: graphql.getIntrospectionQuery({
      specifiedByUrl: true,
      directiveIsRepeatable: true,
      schemaDescription: true,
      inputValueDeprecation: true,
    }),
  },
];

// runIntrospectionTests runs standard gqltest and stepzen introspectionTests.
function runIntrospectionTests(endpoint, headers) {
  runtests("introspection", endpoint, headers, gqlIntrospectionTests);
  runtests(
    "introspection-apic-graphql",
    endpoint,
    headers,
    introspectionTests,
  );
}

exports.admin = admin;
exports.public = public;
exports.regular = regular;
exports.token = token;
exports.introspectionTests = introspectionTests;
exports.runIntrospectionTests = runIntrospectionTests;
