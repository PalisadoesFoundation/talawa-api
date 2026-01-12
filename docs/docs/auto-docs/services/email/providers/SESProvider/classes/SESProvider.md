[API Docs](/)

***

# Class: SESProvider

Defined in: [src/services/email/providers/SESProvider.ts:30](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SESProvider.ts#L30)

AWS SES implementation of IEmailProvider.

This provider uses the @aws-sdk/client-ses to send emails.
It lazily initializes the SESClient and Command constructors on first use.

## Implements

- `IEmailProvider`

## Constructors

### Constructor

> **new SESProvider**(`config`): `SESProvider`

Defined in: [src/services/email/providers/SESProvider.ts:41](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SESProvider.ts#L41)

Creates an instance of SESProvider.

#### Parameters

##### config

[`SESProviderConfig`](../interfaces/SESProviderConfig.md)

The SES configuration object containing region and credentials.

#### Returns

`SESProvider`

## Methods

### sendBulkEmails()

> **sendBulkEmails**(`jobs`): `Promise`\<`EmailResult`[]\>

Defined in: [src/services/email/providers/SESProvider.ts:143](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SESProvider.ts#L143)

Send multiple emails

#### Parameters

##### jobs

`EmailJob`[]

#### Returns

`Promise`\<`EmailResult`[]\>

***

### sendEmail()

> **sendEmail**(`job`): `Promise`\<`EmailResult`\>

Defined in: [src/services/email/providers/SESProvider.ts:101](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SESProvider.ts#L101)

Send a single email using AWS SES

#### Parameters

##### job

`EmailJob`

#### Returns

`Promise`\<`EmailResult`\>
