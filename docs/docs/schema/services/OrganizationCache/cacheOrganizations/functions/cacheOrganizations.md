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

[src/services/OrganizationCache/cacheOrganizations.ts:10](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/services/OrganizationCache/cacheOrganizations.ts#L10)
