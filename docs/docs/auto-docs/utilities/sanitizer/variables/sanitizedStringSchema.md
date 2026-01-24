[**talawa-api**](../../../README.md)

***

# Variable: sanitizedStringSchema

> `const` **sanitizedStringSchema**: `ZodString`

Defined in: [src/utilities/sanitizer.ts:91](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/utilities/sanitizer.ts#L91)

Zod schema for a string that is automatically sanitized (trimmed).
Note: This returns a plain string to allow chaining with .min()/.max().
Use `sanitizeInput()` if you need the branded SanitizedInputString type.
Note: This does NOT escape HTML. HTML escaping should be done at output time.
