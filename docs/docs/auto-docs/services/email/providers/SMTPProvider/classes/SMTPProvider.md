[API Docs](/)

***

# Class: SMTPProvider

Defined in: [src/services/email/providers/SMTPProvider.ts:41](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SMTPProvider.ts#L41)

SMTP implementation of IEmailProvider using Nodemailer.

This provider uses nodemailer to send emails via SMTP.
It lazily initializes the transporter on first use.

## Implements

- [`IEmailProvider`](../../../types/interfaces/IEmailProvider.md)

## Constructors

### Constructor

> **new SMTPProvider**(`config`): `SMTPProvider`

Defined in: [src/services/email/providers/SMTPProvider.ts:51](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SMTPProvider.ts#L51)

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

Defined in: [src/services/email/providers/SMTPProvider.ts:59](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SMTPProvider.ts#L59)

Returns the SMTP configuration for testing purposes.

#### Returns

[`SMTPProviderConfig`](../interfaces/SMTPProviderConfig.md)

The SMTP configuration object.

***

### sendBulkEmails()

> **sendBulkEmails**(`jobs`): `Promise`\<[`EmailResult`](../../../types/interfaces/EmailResult.md)[]\>

Defined in: [src/services/email/providers/SMTPProvider.ts:211](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SMTPProvider.ts#L211)

Sends multiple emails in concurrent batches to respect rate limits.

Processes the jobs list in chunks (defined by BATCH_SIZE), ensuring a delay
between batches to prevent overwhelming the email provider or hitting rate limits.

#### Parameters

##### jobs

[`EmailJob`](../../../types/interfaces/EmailJob.md)[]

An array of email jobs to be processed.

#### Returns

`Promise`\<[`EmailResult`](../../../types/interfaces/EmailResult.md)[]\>

A promise that resolves to an array of results
(success or failure) for each email job.

#### Implementation of

[`IEmailProvider`](../../../types/interfaces/IEmailProvider.md).[`sendBulkEmails`](../../../types/interfaces/IEmailProvider.md#sendbulkemails)

***

### sendEmail()

> **sendEmail**(`job`): `Promise`\<[`EmailResult`](../../../types/interfaces/EmailResult.md)\>

Defined in: [src/services/email/providers/SMTPProvider.ts:141](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SMTPProvider.ts#L141)

Send a single email using the configured SMTP server

#### Parameters

##### job

[`EmailJob`](../../../types/interfaces/EmailJob.md)

#### Returns

`Promise`\<[`EmailResult`](../../../types/interfaces/EmailResult.md)\>

#### Implementation of

[`IEmailProvider`](../../../types/interfaces/IEmailProvider.md).[`sendEmail`](../../../types/interfaces/IEmailProvider.md#sendemail)
