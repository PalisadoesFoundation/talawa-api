[API Docs](/)

***

# Variable: default

> `const` **default**: `FastifyPluginAsync`

Defined in: [src/routes/auth.ts:71](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/routes/auth.ts#L71)

Fastify plugin that registers REST auth routes: POST /auth/signup, /auth/signin,
/auth/refresh, and /auth/logout. All routes use the "auth" rate limit, request
validation via zReplyParsed and auth validators, and the auth service for
sign-up, sign-in, token rotation, and cookie handling.

## Param

Fastify instance. Must provide drizzleClient and rateLimit("auth").
  Optional envConfig with API_COOKIE_DOMAIN (string) and API_IS_SECURE_COOKIES (boolean).
  When present, used to build cookie options for setAuthCookies/clearAuthCookies.

## Returns

Promise that resolves when the plugin is registered (FastifyPluginAsync).
