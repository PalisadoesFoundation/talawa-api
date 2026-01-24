[API Docs](/)

***

# Type Alias: SanitizedInputString

> **SanitizedInputString** = `string` & `object`

Defined in: src/utilities/sanitizer.ts:22

Branded type for strings that have been sanitized (trimmed, normalized) for input.
Use `sanitizeInput()` to create instances of this type.
This is for INPUT normalization, not OUTPUT escaping.

## Type Declaration

### \_\_brand

> `readonly` **\_\_brand**: `"SanitizedInputString"`
