[API Docs](/)

***

# Variable: eventRangeInput

> `const` **eventRangeInput**: `ZodObject`\<\{ `from`: `ZodOptional`\<`ZodPipe`\<`ZodString`, `ZodISODateTime`\>\>; `onlyPublic`: `ZodDefault`\<`ZodOptional`\<`ZodBoolean`\>\>; `organizationId`: `ZodString`; `to`: `ZodOptional`\<`ZodPipe`\<`ZodString`, `ZodISODateTime`\>\>; \}, `$strip`\>

Defined in: [src/graphql/validators/core.ts:210](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/validators/core.ts#L210)

Example: Event range filter input.
Demonstrates date validation and optional filters.

## Remarks

This is an ILLUSTRATIVE EXAMPLE only. Do not use in production code.
Create your own domain-specific validators for actual use cases.
