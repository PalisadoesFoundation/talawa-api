[API Docs](/)

***

# Function: zReplyParsed()

> **zReplyParsed**\<`T`\>(`reply`, `schema`, `body`): `T` \| `undefined`

Defined in: [src/routes/validation/zodReply.ts:41](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/routes/validation/zodReply.ts#L41)

Validates `body` against a Zod schema and either returns the parsed value or sends a 400 response.
Does not throw; route handlers can use `if (!body) return;` after calling this.

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
