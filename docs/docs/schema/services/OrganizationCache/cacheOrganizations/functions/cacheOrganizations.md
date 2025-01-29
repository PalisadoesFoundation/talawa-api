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

[src/services/OrganizationCache/cacheOrganizations.ts:10](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/services/OrganizationCache/cacheOrganizations.ts#L10)
