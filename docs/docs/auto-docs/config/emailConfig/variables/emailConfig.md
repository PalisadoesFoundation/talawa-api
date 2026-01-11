[API Docs](/)

***

# Variable: emailConfig

> `const` **emailConfig**: `object`

Defined in: [src/config/emailConfig.ts:23](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/config/emailConfig.ts#L23)

Email configuration from environment variables

## Type Declaration

### accessKeyId

> **accessKeyId**: `string` \| `undefined` = `envConfig.AWS_ACCESS_KEY_ID`

### fromEmail

> **fromEmail**: `string` \| `undefined` = `envConfig.AWS_SES_FROM_EMAIL`

### fromName

> **fromName**: `string`

### provider

> **provider**: `"ses"` \| `undefined` = `envConfig.API_EMAIL_PROVIDER`

### region

> **region**: `string`

### secretAccessKey

> **secretAccessKey**: `string` \| `undefined` = `envConfig.AWS_SECRET_ACCESS_KEY`
