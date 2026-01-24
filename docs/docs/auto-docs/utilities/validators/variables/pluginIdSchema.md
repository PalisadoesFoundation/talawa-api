[**talawa-api**](../../../README.md)

***

# Variable: pluginIdSchema

> `const` **pluginIdSchema**: `ZodString`

Defined in: [src/utilities/validators.ts:9](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/utilities/validators.ts#L9)

Shared Zod schema for validating Plugin IDs.
Ensures that the ID is alphanumeric (plus underscores and hyphens), starts with a letter,
and is of reasonable length. This prevents directory traversal and shell injection
when the ID is used in file paths or shell commands.
