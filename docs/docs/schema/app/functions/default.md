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

[src/app.ts:21](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/app.ts#L21)

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

[src/app.ts:21](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/app.ts#L21)
