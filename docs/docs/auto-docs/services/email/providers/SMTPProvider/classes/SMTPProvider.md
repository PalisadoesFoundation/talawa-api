[API Docs](/)

***

# Class: SMTPProvider

Defined in: [src/services/email/providers/SMTPProvider.ts:43](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SMTPProvider.ts#L43)

SMTP implementation of IEmailProvider using Nodemailer.

This provider uses nodemailer to send emails via SMTP.
It lazily initializes the transporter on first use.

## Implements

- [`IEmailProvider`](../../../types/interfaces/IEmailProvider.md)

## Constructors

### Constructor

> **new SMTPProvider**(`config`): `SMTPProvider`

Defined in: [src/services/email/providers/SMTPProvider.ts:53](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SMTPProvider.ts#L53)

Creates an instance of SMTPProvider.

#### Parameters

##### config

[`SMTPProviderConfig`](../interfaces/SMTPProviderConfig.md)

The SMTP configuration object containing host, port, and credentials.

#### Returns

`SMTPProvider`

## Methods

### getConfig()

> **getConfig**(): [`SMTPProviderConfig`](../interfaces/SMTPProviderConfig.md)

Defined in: [src/services/email/providers/SMTPProvider.ts:61](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SMTPProvider.ts#L61)

Returns the SMTP configuration for testing purposes.

#### Returns

[`SMTPProviderConfig`](../interfaces/SMTPProviderConfig.md)

The SMTP configuration object.

***

### sendBulkEmails()

> **sendBulkEmails**(`jobs`): `Promise`\<[`EmailResult`](../../../types/interfaces/EmailResult.md)[]\>

Defined in: [src/services/email/providers/SMTPProvider.ts:209](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SMTPProvider.ts#L209)

Send multiple emails in bulk with rate limiting and concurrent batching.

#### Parameters

##### jobs

[`EmailJob`](../../../types/interfaces/EmailJob.md)[]

An array of EmailJob objects to be sent.

#### Returns

`Promise`\<[`EmailResult`](../../../types/interfaces/EmailResult.md)[]\>

A Promise that resolves to an array of EmailResult objects.

#### Implementation of

[`IEmailProvider`](../../../types/interfaces/IEmailProvider.md).[`sendBulkEmails`](../../../types/interfaces/IEmailProvider.md#sendbulkemails)

***

### sendEmail()

> **sendEmail**(`job`): `Promise`\<[`EmailResult`](../../../types/interfaces/EmailResult.md)\>

Defined in: [src/services/email/providers/SMTPProvider.ts:143](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SMTPProvider.ts#L143)

Send a single email using the configured SMTP server

#### Parameters

##### job

[`EmailJob`](../../../types/interfaces/EmailJob.md)

#### Returns

`Promise`\<[`EmailResult`](../../../types/interfaces/EmailResult.md)\>

#### Implementation of

[`IEmailProvider`](../../../types/interfaces/IEmailProvider.md).[`sendEmail`](../../../types/interfaces/IEmailProvider.md#sendemail)
