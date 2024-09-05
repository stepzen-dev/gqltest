# gqltest

Testing of GraphQL APIs

# Work in progress

## Sample use

```
describe('Starwars', function () {
  it('hero', async function () {
    let response = await execute(endpoint, {
      query: '{hero {name}}',
    })
    response.expectOK()
  })
})
```
