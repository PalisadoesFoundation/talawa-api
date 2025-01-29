[**talawa-api**](../../README.md)

***

# Function: default()

## Call Signature

> **default**(`req`, `res`): `any`

Express instance itself is a request handler, which could be invoked without
third argument.

### Parameters

#### req

`Request` | `IncomingMessage`

#### res

`Response` | `ServerResponse`

### Returns

`any`

### Defined in

[src/app.ts:21](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/app.ts#L21)

## Call Signature

> **default**(`req`, `res`, `next`): `void`

### Parameters

#### req

`Request`

#### res

`Response`

#### next

`NextFunction`

### Returns

`void`

### Defined in

[src/app.ts:21](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/app.ts#L21)
