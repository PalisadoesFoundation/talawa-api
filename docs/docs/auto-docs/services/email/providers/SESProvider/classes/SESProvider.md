[API Docs](/)

***

# Class: SESProvider

Defined in: [src/services/email/providers/SESProvider.ts:33](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SESProvider.ts#L33)

AWS SES implementation of IEmailProvider.

This provider uses the @aws-sdk/client-ses to send emails.
It lazily initializes the SESClient and Command constructors on first use.

## Implements

- [`IEmailProvider`](../../../types/interfaces/IEmailProvider.md)

## Constructors

### Constructor

> **new SESProvider**(`config`): `SESProvider`

Defined in: [src/services/email/providers/SESProvider.ts:44](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SESProvider.ts#L44)

Creates an instance of SESProvider.

#### Parameters

##### config

[`SESProviderConfig`](../interfaces/SESProviderConfig.md)

The SES configuration object containing region and credentials.

#### Returns

`SESProvider`

## Methods

### sendBulkEmails()

> **sendBulkEmails**(`jobs`): `Promise`\<[`EmailResult`](../../../types/interfaces/EmailResult.md)[]\>

Defined in: [src/services/email/providers/SESProvider.ts:166](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SESProvider.ts#L166)

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

Defined in: [src/services/email/providers/SESProvider.ts:107](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SESProvider.ts#L107)

Send a single email using AWS SES

#### Parameters

##### job

[`EmailJob`](../../../types/interfaces/EmailJob.md)

#### Returns

`Promise`\<[`EmailResult`](../../../types/interfaces/EmailResult.md)\>

#### Implementation of

[`IEmailProvider`](../../../types/interfaces/IEmailProvider.md).[`sendEmail`](../../../types/interfaces/IEmailProvider.md#sendemail)
