[API Docs](/)

***

# Function: zReplyParsed()

> **zReplyParsed**\<`T`\>(`reply`, `schema`, `body`): `T` \| `undefined`

Defined in: [src/routes/validation/zodReply.ts:43](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/routes/validation/zodReply.ts#L43)

Validates `body` against a Zod schema and either returns the parsed value or sends a 400 response.
Does not throw. Callers should check strictly for undefined, e.g. `if (body === undefined) return;`,
so that valid falsy values (e.g. 0 from z.number(), false from z.boolean()) are not treated as
failure.

## Type Parameters

### T

`T`

## Parameters

### reply

`FastifyReply`

Fastify reply instance for sending 400 on validation failure

### schema

`ZodType`\<`T`\>

Zod schema to validate against

### body

`unknown`

Raw request body (unknown)

## Returns

`T` \| `undefined`

Parsed value of type T on success, or undefined after sending 400 on failure
