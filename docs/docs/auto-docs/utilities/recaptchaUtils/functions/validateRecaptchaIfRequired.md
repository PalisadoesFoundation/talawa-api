[API Docs](/)

***

# Function: validateRecaptchaIfRequired()

> **validateRecaptchaIfRequired**(`recaptchaToken`, `recaptchaSecretKey`, `argumentPath`, `logger`): `Promise`\<`boolean` \| `undefined`\>

Defined in: [src/utilities/recaptchaUtils.ts:56](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/recaptchaUtils.ts#L56)

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

### logger

`FastifyBaseLogger`

Logger for error reporting

## Returns

`Promise`\<`boolean` \| `undefined`\>

Promise that resolves if verification passes or is not required

## Throws

TalawaGraphQLError if verification fails or is required but missing
