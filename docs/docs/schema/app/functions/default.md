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

[src/app.ts:21](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/app.ts#L21)

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

[src/app.ts:21](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/app.ts#L21)
