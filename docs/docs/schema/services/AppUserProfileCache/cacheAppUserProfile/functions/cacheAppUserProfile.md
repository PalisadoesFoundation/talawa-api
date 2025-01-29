[Admin Docs](/)

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

Promise`void`

## Defined in

[src/services/AppUserProfileCache/cacheAppUserProfile.ts:10](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/services/AppUserProfileCache/cacheAppUserProfile.ts#L10)
