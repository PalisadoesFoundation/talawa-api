[Admin Docs](/)

***

# Function: generateUserData()

> **generateUserData**(`organizationId`, `userType`): `Promise`\<\{ `appUserProfile`: `Document`\<`unknown`, \{\}, [`InterfaceAppUserProfile`](../../../models/AppUserProfile/interfaces/InterfaceAppUserProfile.md)\> & [`InterfaceAppUserProfile`](../../../models/AppUserProfile/interfaces/InterfaceAppUserProfile.md) & `Required`\<\{\}\>; `user`: `Document`\<`unknown`, \{\}, [`InterfaceUser`](../../../models/User/interfaces/InterfaceUser.md)\> & [`InterfaceUser`](../../../models/User/interfaces/InterfaceUser.md) & `Required`\<\{\}\>; \}\>

Generates user data for a given organization and user type.

## Parameters

### organizationId

`string`

The ID of the organization the user belongs to

### userType

`string`

The type of the user ('ADMIN' or 'USER')

## Returns

`Promise`\<\{ `appUserProfile`: `Document`\<`unknown`, \{\}, [`InterfaceAppUserProfile`](../../../models/AppUserProfile/interfaces/InterfaceAppUserProfile.md)\> & [`InterfaceAppUserProfile`](../../../models/AppUserProfile/interfaces/InterfaceAppUserProfile.md) & `Required`\<\{\}\>; `user`: `Document`\<`unknown`, \{\}, [`InterfaceUser`](../../../models/User/interfaces/InterfaceUser.md)\> & [`InterfaceUser`](../../../models/User/interfaces/InterfaceUser.md) & `Required`\<\{\}\>; \}\>

A promise that resolves to an object containing the created user and their application profile

## Defined in

[src/utilities/createSampleOrganizationUtil.ts:24](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/utilities/createSampleOrganizationUtil.ts#L24)
