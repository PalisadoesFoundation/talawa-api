[**talawa-api**](../../../../README.md)

***

# Function: cacheAppUserProfile()

> **cacheAppUserProfile**(`appUserProfiles`): `Promise`\<`void`\>

Stores app user profiles in Redis cache with a specified time-to-live (TTL).

## Parameters

### appUserProfiles

[`InterfaceAppUserProfile`](../../../../models/AppUserProfile/interfaces/InterfaceAppUserProfile.md)[]

Array of app user profiles to be cached.

## Returns

`Promise`\<`void`\>

Promise<void>

## Defined in

[src/services/AppUserProfileCache/cacheAppUserProfile.ts:10](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/services/AppUserProfileCache/cacheAppUserProfile.ts#L10)
