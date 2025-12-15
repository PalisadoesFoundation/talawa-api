[API Docs](/)

***

# Variable: sanitizedStringSchema

> `const` **sanitizedStringSchema**: `ZodString`

Defined in: [src/utilities/sanitizer.ts:48](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/sanitizer.ts#L48)

Zod schema for a string that is automatically sanitized (trimmed).
Note: This does NOT escape HTML. HTML escaping should be done at output time.
