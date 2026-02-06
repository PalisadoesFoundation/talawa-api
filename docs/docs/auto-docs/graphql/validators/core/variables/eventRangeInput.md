[API Docs](/)

***

# Variable: eventRangeInput

> `const` **eventRangeInput**: `ZodObject`\<\{ `from`: `ZodOptional`\<`ZodPipe`\<`ZodString`, `ZodISODateTime`\>\>; `onlyPublic`: `ZodDefault`\<`ZodOptional`\<`ZodBoolean`\>\>; `organizationId`: `ZodString`; `to`: `ZodOptional`\<`ZodPipe`\<`ZodString`, `ZodISODateTime`\>\>; \}, `$strip`\>

Defined in: [src/graphql/validators/core.ts:197](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/validators/core.ts#L197)

Example: Event range filter input.
Demonstrates date validation and optional filters.
