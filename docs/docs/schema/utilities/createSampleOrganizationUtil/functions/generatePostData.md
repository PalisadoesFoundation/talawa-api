[**talawa-api**](../../../README.md)

***

# Function: generatePostData()

> **generatePostData**(`users`, `organizationId`): `Promise`\<[`InterfacePost`](../../../models/Post/interfaces/InterfacePost.md) & `Document`\<[`InterfacePost`](../../../models/Post/interfaces/InterfacePost.md)\>\>

Generates post data for a given list of users and organization.

## Parameters

### users

[`InterfaceUser`](../../../models/User/interfaces/InterfaceUser.md)[]

The list of users associated with the post

### organizationId

`string`

The ID of the organization the post belongs to

## Returns

`Promise`\<[`InterfacePost`](../../../models/Post/interfaces/InterfacePost.md) & `Document`\<[`InterfacePost`](../../../models/Post/interfaces/InterfacePost.md)\>\>

A promise that resolves to the created post

## Defined in

[src/utilities/createSampleOrganizationUtil.ts:151](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/utilities/createSampleOrganizationUtil.ts#L151)
