[API Docs](/)

***

# Variable: default()

> **default**: (`app`) => `Promise`\<`void`\>

Defined in: [src/fastifyPlugins/auth.ts:92](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/fastifyPlugins/auth.ts#L92)

Registers a global preHandler hook that populates `req.currentUser` from a valid access JWT
(via getTokenFromRequest and verifyToken with AccessPayload), and decorates the app with
requireAuth() for protecting routes.

## Parameters

### app

`FastifyInstance`

The Fastify instance to register on; it will receive a preHandler that sets
  req.currentUser when a valid access token is present (cookie or Bearer), and a requireAuth()
  decorator that returns a preHandler which throws if req.currentUser is not set.

## Returns

`Promise`\<`void`\>

Resolves when the preHandler hook and requireAuth decorator are registered.
