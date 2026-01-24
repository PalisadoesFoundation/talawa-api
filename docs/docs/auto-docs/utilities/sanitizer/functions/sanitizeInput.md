[**talawa-api**](../../../README.md)

***

# Function: sanitizeInput()

## Call Signature

> **sanitizeInput**(`str`): [`SanitizedInputString`](../type-aliases/SanitizedInputString.md)

Defined in: [src/utilities/sanitizer.ts:55](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/utilities/sanitizer.ts#L55)

Sanitizes user input by trimming whitespace and normalizing the string.
This is for INPUT normalization, not OUTPUT escaping.

### Parameters

#### str

`string`

The string to sanitize.

### Returns

[`SanitizedInputString`](../type-aliases/SanitizedInputString.md)

- The sanitized (trimmed) string with branded type.

## Call Signature

> **sanitizeInput**(`str`): [`SanitizedInputString`](../type-aliases/SanitizedInputString.md) \| `null`

Defined in: [src/utilities/sanitizer.ts:56](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/utilities/sanitizer.ts#L56)

Sanitizes user input by trimming whitespace and normalizing the string.
This is for INPUT normalization, not OUTPUT escaping.

### Parameters

#### str

The string to sanitize.

`string` | `null`

### Returns

[`SanitizedInputString`](../type-aliases/SanitizedInputString.md) \| `null`

- The sanitized (trimmed) string with branded type.

## Call Signature

> **sanitizeInput**(`str`): [`SanitizedInputString`](../type-aliases/SanitizedInputString.md) \| `undefined`

Defined in: [src/utilities/sanitizer.ts:57](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/utilities/sanitizer.ts#L57)

Sanitizes user input by trimming whitespace and normalizing the string.
This is for INPUT normalization, not OUTPUT escaping.

### Parameters

#### str

The string to sanitize.

`string` | `undefined`

### Returns

[`SanitizedInputString`](../type-aliases/SanitizedInputString.md) \| `undefined`

- The sanitized (trimmed) string with branded type.

## Call Signature

> **sanitizeInput**(`str`): [`SanitizedInputString`](../type-aliases/SanitizedInputString.md) \| `null` \| `undefined`

Defined in: [src/utilities/sanitizer.ts:60](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/utilities/sanitizer.ts#L60)

Sanitizes user input by trimming whitespace and normalizing the string.
This is for INPUT normalization, not OUTPUT escaping.

### Parameters

#### str

The string to sanitize.

`string` | `null` | `undefined`

### Returns

[`SanitizedInputString`](../type-aliases/SanitizedInputString.md) \| `null` \| `undefined`

- The sanitized (trimmed) string with branded type.
