[Admin Docs](/)

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

[src/utilities/createSampleOrganizationUtil.ts:151](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/utilities/createSampleOrganizationUtil.ts#L151)
