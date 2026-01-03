[API Docs](/)

***

# Function: verifyRecaptchaToken()

> **verifyRecaptchaToken**(`token`, `secretKey`, `logger`): `Promise`\<`boolean`\>

Defined in: [src/utilities/recaptchaUtils.ts:14](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/recaptchaUtils.ts#L14)

Verifies a Google reCAPTCHA v2 token by making a request to Google's verification API.

## Parameters

### token

`string`

### secretKey

`string`

### logger

`FastifyBaseLogger`

## Returns

`Promise`\<`boolean`\>
