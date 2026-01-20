[API Docs](/)

***

# Variable: sanitizedStringSchema

> `const` **sanitizedStringSchema**: `ZodString`

Defined in: [src/utilities/sanitizer.ts:91](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/sanitizer.ts#L91)

Zod schema for a string that is automatically sanitized (trimmed).
Note: This returns a plain string to allow chaining with .min()/.max().
Use `sanitizeInput()` if you need the branded SanitizedInputString type.
Note: This does NOT escape HTML. HTML escaping should be done at output time.
