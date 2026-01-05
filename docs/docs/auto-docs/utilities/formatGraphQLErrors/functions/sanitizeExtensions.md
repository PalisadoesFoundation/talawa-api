[API Docs](/)

***

# Function: sanitizeExtensions()

> **sanitizeExtensions**(`extensions?`): `Record`\<`string`, `unknown`\>

Defined in: [src/utilities/formatGraphQLErrors.ts:56](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/formatGraphQLErrors.ts#L56)

Sanitizes the extensions object by removing sensitive keys and preserving safe ones.

## Parameters

### extensions?

`Record`\<`string`, `unknown`\>

The original extensions object

## Returns

`Record`\<`string`, `unknown`\>

A new object with sanitized extensions
