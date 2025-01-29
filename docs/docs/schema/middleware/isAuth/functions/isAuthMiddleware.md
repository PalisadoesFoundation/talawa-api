[**talawa-api**](../../../README.md)

***

# Function: isAuthMiddleware()

> **isAuthMiddleware**(`req`, `res`, `next`): `void`

Middleware for REST APIs to authenticate users based on the JWT token in the Authorization header.

This middleware checks if the incoming request has a valid JWT token. It sets the authentication
status, user ID, and token expiration status on the `req` object for downstream middleware and
route handlers to use.

## Parameters

### req

[`InterfaceAuthenticatedRequest`](../interfaces/InterfaceAuthenticatedRequest.md)

The incoming request object. The JWT token is expected in the `Authorization` header.

### res

`Response`

The response object. If authentication fails, an HTTP 401 response will be sent.

### next

`NextFunction`

The next middleware function in the stack. It is called if the user is authenticated.

## Returns

`void`

Returns a 401 Unauthorized response if the user is not authenticated or the token has expired.

## Example

```typescript
app.use("/api/protected-route", isAuthMiddleware, (req, res) => {
  if (req.isAuth) {
    res.json({ message: "This is a protected route" });
  }
});
```

## Defined in

[src/middleware/isAuth.ts:110](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/middleware/isAuth.ts#L110)
