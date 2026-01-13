[API Docs](/)

***

# Variable: EmailProviderFactory

> `const` **EmailProviderFactory**: `object`

Defined in: [src/services/email/EmailProviderFactory.ts:5](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/EmailProviderFactory.ts#L5)

## Type Declaration

### create()

> **create**(`config`): [`IEmailProvider`](../../types/interfaces/IEmailProvider.md)

Creates an email provider instance based on configuration.

#### Parameters

##### config

Email environment configuration

###### API_EMAIL_PROVIDER?

`"ses"` \| `"smtp"`

###### AWS_ACCESS_KEY_ID?

`string`

###### AWS_SECRET_ACCESS_KEY?

`string`

###### AWS_SES_FROM_EMAIL?

`string`

###### AWS_SES_FROM_NAME?

`string`

###### AWS_SES_REGION?

`string`

#### Returns

[`IEmailProvider`](../../types/interfaces/IEmailProvider.md)

Email provider instance implementing IEmailProvider

#### Throws

Error if AWS_SES_REGION is missing for SES provider

#### Throws

Error if provider type is unsupported
