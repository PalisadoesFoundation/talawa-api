[API Docs](/)

***

# Variable: errorHandlerPlugin()

> `const` **errorHandlerPlugin**: (`fastify`) => `Promise`\<`void`\>

Defined in: [src/fastifyPlugins/errorHandler.ts:45](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/fastifyPlugins/errorHandler.ts#L45)

Global Fastify error handler plugin that provides unified error responses.

This plugin registers a global error handler that:
- Transforms all errors into standardized response format
- Adds correlation IDs for request tracing
- Maps error codes to appropriate HTTP status codes
- Provides structured logging with error context
- Handles various error types (TalawaRestError, validation errors, generic errors)

The error handler ensures consistent error responses across all REST endpoints
and integrates with the error transformation system.

## Parameters

### fastify

`FastifyInstance`

The Fastify instance to register the error handler on

## Returns

`Promise`\<`void`\>

## Example

```ts
// Register the plugin
await fastify.register(errorHandlerPlugin);

// Now all routes can throw structured errors
fastify.get('/users/:id', async (request) => {
  const user = await findUser(request.params.id);
  if (!user) {
    throw new TalawaRestError({
      code: ErrorCode.NOT_FOUND,
      message: 'User not found',
      details: { userId: request.params.id }
    });
  }
  return user;
});
```
