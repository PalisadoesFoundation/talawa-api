[API Docs](/)

***

# Class: SMTPProvider

Defined in: [src/services/email/providers/SMTPProvider.ts:40](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SMTPProvider.ts#L40)

SMTP implementation of IEmailProvider using Nodemailer.

This provider uses nodemailer to send emails via SMTP.
It lazily initializes the transporter on first use.

## Implements

- [`IEmailProvider`](../../../types/interfaces/IEmailProvider.md)

## Constructors

### Constructor

> **new SMTPProvider**(`config`): `SMTPProvider`

Defined in: [src/services/email/providers/SMTPProvider.ts:50](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SMTPProvider.ts#L50)

Creates an instance of SMTPProvider.

#### Parameters

##### config

[`SMTPProviderConfig`](../interfaces/SMTPProviderConfig.md)

The SMTP configuration object containing host, port, and credentials.

#### Returns

`SMTPProvider`

## Methods

### sendBulkEmails()

> **sendBulkEmails**(`jobs`): `Promise`\<[`EmailResult`](../../../types/interfaces/EmailResult.md)[]\>

Defined in: [src/services/email/providers/SMTPProvider.ts:179](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SMTPProvider.ts#L179)

Send multiple emails in bulk with rate limiting.
Accepts sparse arrays (nullish values are skipped).

#### Parameters

##### jobs

([`EmailJob`](../../../types/interfaces/EmailJob.md) \| `null` \| `undefined`)[]

#### Returns

`Promise`\<[`EmailResult`](../../../types/interfaces/EmailResult.md)[]\>

#### Implementation of

[`IEmailProvider`](../../../types/interfaces/IEmailProvider.md).[`sendBulkEmails`](../../../types/interfaces/IEmailProvider.md#sendbulkemails)

***

### sendEmail()

> **sendEmail**(`job`): `Promise`\<[`EmailResult`](../../../types/interfaces/EmailResult.md)\>

Defined in: [src/services/email/providers/SMTPProvider.ts:121](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SMTPProvider.ts#L121)

Send a single email using the configured SMTP server

#### Parameters

##### job

[`EmailJob`](../../../types/interfaces/EmailJob.md)

#### Returns

`Promise`\<[`EmailResult`](../../../types/interfaces/EmailResult.md)\>

#### Implementation of

[`IEmailProvider`](../../../types/interfaces/IEmailProvider.md).[`sendEmail`](../../../types/interfaces/IEmailProvider.md#sendemail)
