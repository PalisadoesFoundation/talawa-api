[API Docs](/)

***

# Function: verifyRecaptchaToken()

> **verifyRecaptchaToken**(`token`, `secretKey`, `expectedAction?`, `scoreThreshold?`): `Promise`\<\{ `action?`: `string`; `score?`: `number`; `success`: `boolean`; \}\>

Defined in: [src/utilities/recaptchaUtils.ts:21](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/recaptchaUtils.ts#L21)

Verifies a Google reCAPTCHA v3 token by making a request to Google's verification API.

## Parameters

### token

`string`

The reCAPTCHA token to verify

### secretKey

`string`

The secret key for verification

### expectedAction?

`string`

The expected action name (optional, for additional validation)

### scoreThreshold?

`number` = `0.5`

Minimum score threshold (0.0-1.0, default 0.5)

## Returns

`Promise`\<\{ `action?`: `string`; `score?`: `number`; `success`: `boolean`; \}\>
