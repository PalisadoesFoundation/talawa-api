[**talawa-api**](../../../README.md)

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

[src/libraries/requestTracing.ts:57](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/libraries/requestTracing.ts#L57)
