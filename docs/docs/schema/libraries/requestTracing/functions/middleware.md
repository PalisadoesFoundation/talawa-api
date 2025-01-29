[Admin Docs](/)

***

# Function: middleware()

> **middleware**(): (`req`, `res`, `next`) => `void`

Middleware to handle request tracing. It generates or retrieves a tracing ID,
sets it in the headers of the request and response, and stores it in the namespace context.

## Returns

`Function`

A middleware function.

### Parameters

#### req

`Request`

#### res

`Response`

#### next

`NextFunction`

### Returns

`void`

## Defined in

[src/libraries/requestTracing.ts:57](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/libraries/requestTracing.ts#L57)
