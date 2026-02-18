[API Docs](/)

***

# Variable: EmailProviderFactory

> `const` **EmailProviderFactory**: `object`

Defined in: [src/services/email/EmailProviderFactory.ts:8](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/EmailProviderFactory.ts#L8)

## Type Declaration

### create()

> **create**(`config`): [`IEmailProvider`](../../types/interfaces/IEmailProvider.md)

Creates an email provider instance based on configuration.

#### Parameters

##### config

Email environment configuration

###### API_AWS_ACCESS_KEY_ID?

`string`

###### API_AWS_SECRET_ACCESS_KEY?

`string`

###### API_AWS_SES_FROM_EMAIL?

`string`

###### API_AWS_SES_FROM_NAME?

`string`

###### API_AWS_SES_REGION?

`string`

###### API_EMAIL_PROVIDER?

`"ses"` \| `"smtp"` \| `"mailpit"`

###### API_SMTP_FROM_EMAIL?

`string`

###### API_SMTP_FROM_NAME?

`string`

###### API_SMTP_HOST?

`string`

###### API_SMTP_LOCAL_ADDRESS?

`string`

###### API_SMTP_NAME?

`string`

###### API_SMTP_PASSWORD?

`string`

###### API_SMTP_PORT?

`number`

###### API_SMTP_SECURE?

`boolean`

###### API_SMTP_USER?

`string`

#### Returns

[`IEmailProvider`](../../types/interfaces/IEmailProvider.md)

Email provider instance implementing IEmailProvider

#### Throws

Error if API_AWS_SES_REGION is missing for SES provider

#### Throws

Error if API_SMTP_HOST is missing for SMTP provider

#### Throws

Error if API_SMTP_PORT is missing for SMTP provider

#### Throws

Error if provider type is unsupported

#### Remarks

For SMTP provider, optional fields (API_SMTP_USER, API_SMTP_PASSWORD, API_SMTP_SECURE,
API_SMTP_FROM_EMAIL, API_SMTP_FROM_NAME) are passed through to SMTPProvider.
For SES provider, optional fields (API_AWS_ACCESS_KEY_ID, API_AWS_SECRET_ACCESS_KEY,
API_AWS_SES_FROM_NAME) are passed through to SESProvider.
Mailpit is used for local email testing by default.
