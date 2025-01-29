[**talawa-api**](../../../../README.md)

***

# Function: isAuthorised()

> **isAuthorised**(`requestingUser`, `requestedUser`): `boolean`

Checks if the requesting user is authorized to access or modify the requested user's data.

## Parameters

### requestingUser

[`User`](../../../../types/generatedGraphQLTypes/type-aliases/User.md)

The user making the request.

### requestedUser

[`User`](../../../../types/generatedGraphQLTypes/type-aliases/User.md)

The user whose data is being requested or modified.

## Returns

`boolean`

`true` if the requesting user is authorized, `false` otherwise.

## Defined in

[src/utilities/PII/isAuthorised.ts:9](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/utilities/PII/isAuthorised.ts#L9)
