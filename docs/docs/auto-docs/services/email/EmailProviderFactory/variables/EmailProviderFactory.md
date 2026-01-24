[**talawa-api**](../../../../README.md)

***

# Variable: EmailProviderFactory

> `const` **EmailProviderFactory**: `object`

Defined in: src/services/email/EmailProviderFactory.ts:6

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

###### SMTP_FROM_EMAIL?

`string`

###### SMTP_FROM_NAME?

`string`

###### SMTP_HOST?

`string`

###### SMTP_LOCAL_ADDRESS?

`string`

###### SMTP_NAME?

`string`

###### SMTP_PASSWORD?

`string`

###### SMTP_PORT?

`number`

###### SMTP_SECURE?

`boolean`

###### SMTP_USER?

`string`

#### Returns

[`IEmailProvider`](../../types/interfaces/IEmailProvider.md)

Email provider instance implementing IEmailProvider

#### Throws

Error if AWS_SES_REGION is missing for SES provider

#### Throws

Error if SMTP_HOST is missing for SMTP provider

#### Throws

Error if SMTP_PORT is missing for SMTP provider

#### Throws

Error if provider type is unsupported

#### Remarks

For SMTP provider, optional fields (SMTP_USER, SMTP_PASSWORD, SMTP_SECURE,
SMTP_FROM_EMAIL, SMTP_FROM_NAME) are passed through to SMTPProvider.
For SES provider, optional fields (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY,
AWS_SES_FROM_NAME) are passed through to SESProvider.
