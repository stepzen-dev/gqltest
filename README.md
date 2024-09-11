# gqltest

Testing of GraphQL APIs

# Work in progress

## Sample use

```
describe('Starwars', function () {
  afterEach('log-failure', logOnFail);

  it('hero-data', function () {
     execute({
      test: this,
      endpoint,
      request: {
        query: '{hero {name}}',
      },
      expected: {hero: {name: 'R2-D2'}},
    })
  })

})
```
