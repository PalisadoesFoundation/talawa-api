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

Executes the sendBulkEmails operation to process multiple email requests concurrently in batches.
This method ensures compliance with AWS SES rate limits (defaults to 14 messages per second)
while maximizing network throughput.

#### Parameters

##### jobs

[`EmailJob`](../../../types/interfaces/EmailJob.md)[]

An array of EmailJob objects to be sent.

#### Returns

`Promise`\<[`EmailResult`](../../../types/interfaces/EmailResult.md)[]\>

A Promise that resolves to an array of EmailResult objects, providing the success status, message ID, or error details for each processed email.

#### Implementation of

[`IEmailProvider`](../../../types/interfaces/IEmailProvider.md).[`sendBulkEmails`](../../../types/interfaces/IEmailProvider.md#sendbulkemails)

***

### sendEmail()

> **sendEmail**(`job`): `Promise`\<[`EmailResult`](../../../types/interfaces/EmailResult.md)\>

Defined in: [src/services/email/providers/SESProvider.ts:109](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SESProvider.ts#L109)

Send a single email using AWS SES

#### Parameters

##### job

[`EmailJob`](../../../types/interfaces/EmailJob.md)

#### Returns

`Promise`\<[`EmailResult`](../../../types/interfaces/EmailResult.md)\>

#### Implementation of

[`IEmailProvider`](../../../types/interfaces/IEmailProvider.md).[`sendEmail`](../../../types/interfaces/IEmailProvider.md#sendemail)
