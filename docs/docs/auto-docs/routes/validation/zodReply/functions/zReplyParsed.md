[API Docs](/)

***

# Function: zReplyParsed()

> **zReplyParsed**\<`TSchema`\>(`reply`, `schema`, `data`): `Promise`\<`output`\<`TSchema`\> \| `undefined`\>

Defined in: [src/routes/validation/zodReply.ts:77](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/routes/validation/zodReply.ts#L77)

Validates data against a Zod schema and sends a 400 error response if validation fails.

This helper provides unified validation for REST routes by:
1. Running async validation with Zod's safeParseAsync
2. Sending a 400 Bad Request response with unified error format on failure
3. Including flattened error details and correlation ID for debugging
4. Returning parsed data on success or undefined on failure

The function integrates with the unified error handling system by using ErrorCode.INVALID_ARGUMENTS
and providing a consistent error shape across REST and GraphQL endpoints.

## Type Parameters

### TSchema

`TSchema` *extends* `ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\>

## Parameters

### reply

`FastifyReply`

The Fastify reply object

### schema

`TSchema`

The Zod schema to validate against

### data

`unknown`

The data to validate (typically request body, params, or query)

## Returns

`Promise`\<`output`\<`TSchema`\> \| `undefined`\>

The parsed and validated data, or undefined if validation failed (response already sent)

## Examples

```ts
// In a Fastify route
import { zReplyParsed } from "~/src/routes/validation/zodReply";
import { uuid, pagination } from "~/src/graphql/validators/core";

const listArgs = z.object({
  q: z.string().optional().default(""),
  page: pagination.optional().default({ limit: 20, cursor: null }),
});

app.get("/organizations", async (req, reply) => {
  const parsed = await zReplyParsed(reply, listArgs, req.query);
  if (!parsed) return; // Error response already sent

  const { q, page } = parsed;
  // ...rest of route handler
});
```

```ts
// Validating route params
const paramsSchema = z.object({ id: uuid });

app.get("/organizations/:id", async (req, reply) => {
  const params = await zReplyParsed(reply, paramsSchema, req.params);
  if (!params) return;

  // params.id is a validated UUID
});
```

```ts
// Error response format
// {
//   "error": {
//     "code": "invalid_arguments",
//     "message": "Invalid request body",
//     "details": {
//       "fieldErrors": {
//         "id": ["Must be a valid UUID"]
//       },
//       "formErrors": []
//     },
//     "correlationId": "req-abc123"
//   }
// }
```
