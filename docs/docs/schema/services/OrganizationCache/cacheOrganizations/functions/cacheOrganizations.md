[**talawa-api**](../../../../README.md)

***

# Function: cacheOrganizations()

> **cacheOrganizations**(`organizations`): `Promise`\<`void`\>

Stores organizations in Redis cache with a specified time-to-live (TTL).

## Parameters

### organizations

[`InterfaceOrganization`](../../../../models/Organization/interfaces/InterfaceOrganization.md)[]

Array of organizations to be cached.

## Returns

`Promise`\<`void`\>

Promise<void>

## Defined in

[src/services/OrganizationCache/cacheOrganizations.ts:10](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/services/OrganizationCache/cacheOrganizations.ts#L10)
