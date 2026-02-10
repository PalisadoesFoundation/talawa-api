[API Docs](/)

***

# Function: validateRecaptchaIfRequired()

> **validateRecaptchaIfRequired**(`recaptchaToken`, `recaptchaSecretKey`, `argumentPath`, `action?`, `scoreThreshold?`): `Promise`\<`boolean` \| `undefined`\>

Defined in: [src/utilities/recaptchaUtils.ts:86](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/recaptchaUtils.ts#L86)

Validates reCAPTCHA token if required based on environment configuration.

## Parameters

### recaptchaToken

The reCAPTCHA token to verify (optional)

`string` | `undefined`

### recaptchaSecretKey

The secret key from environment config

`string` | `undefined`

### argumentPath

`string`[]

The GraphQL argument path for error reporting

### action?

`string`

The expected action name for v3 validation

### scoreThreshold?

`number` = `0.5`

Minimum score threshold (0.0-1.0, default 0.5)

## Returns

`Promise`\<`boolean` \| `undefined`\>

Promise that resolves if verification passes or is not required

## Throws

TalawaGraphQLError if verification fails or is required but missing
