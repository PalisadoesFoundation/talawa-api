[API Docs](/)

***

# Function: isSanitizedInput()

> **isSanitizedInput**(`value`): `value is SanitizedInputString`

Defined in: [src/utilities/sanitizer.ts:79](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/sanitizer.ts#L79)

Type guard to check if a value is a SanitizedInputString.
Note: At runtime, this just checks if it's a non-empty trimmed string.
The branded type provides compile-time safety.

## Parameters

### value

`unknown`

The value to check.

## Returns

`value is SanitizedInputString`

True if the value appears to be sanitized input.
