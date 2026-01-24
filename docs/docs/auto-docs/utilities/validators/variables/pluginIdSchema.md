[API Docs](/)

***

# Variable: pluginIdSchema

> `const` **pluginIdSchema**: `ZodString`

Defined in: src/utilities/validators.ts:9

Shared Zod schema for validating Plugin IDs.
Ensures that the ID is alphanumeric (plus underscores and hyphens), starts with a letter,
and is of reasonable length. This prevents directory traversal and shell injection
when the ID is used in file paths or shell commands.
