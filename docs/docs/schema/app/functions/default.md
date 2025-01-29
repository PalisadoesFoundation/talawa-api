[Admin Docs](/)

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

[src/app.ts:21](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/app.ts#L21)

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

[src/app.ts:21](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/app.ts#L21)
