[Admin Docs](/)

***

# Function: adminCheck()

> **adminCheck**(`userId`, `organization`, `throwError`): `Promise`\<`boolean`\>

Checks if the current user is an admin of the organization.
If the user is an admin, the function completes successfully. Otherwise, it throws an UnauthorizedError.

## Parameters

### userId

The ID of the current user. It can be a string or a Types.ObjectId.

`string` | `ObjectId`

### organization

[`InterfaceOrganization`](../../../models/Organization/interfaces/InterfaceOrganization.md)

The organization data of `InterfaceOrganization` type.

### throwError

`boolean` = `true`

A boolean value to determine if the function should throw an error. Default is `true`.

## Returns

`Promise`\<`boolean`\>

`True` or `False`.

## Remarks

This is a utility method.

## Defined in

[src/utilities/adminCheck.ts:18](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/utilities/adminCheck.ts#L18)
