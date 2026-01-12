[API Docs](/)

***

# Class: SESProvider

Defined in: [src/services/email/providers/SESProvider.ts:27](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SESProvider.ts#L27)

AWS SES implementation of IEmailProvider.

This provider uses the @aws-sdk/client-ses to send emails.
It lazily initializes the SESClient and Command constructors on first use.

## Implements

- [`IEmailProvider`](../../../types/interfaces/IEmailProvider.md)

## Constructors

### Constructor

> **new SESProvider**(`config`): `SESProvider`

Defined in: [src/services/email/providers/SESProvider.ts:38](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SESProvider.ts#L38)

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

Defined in: [src/services/email/providers/SESProvider.ts:140](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SESProvider.ts#L140)

Send multiple emails

#### Parameters

##### jobs

[`EmailJob`](../../../types/interfaces/EmailJob.md)[]

#### Returns

`Promise`\<[`EmailResult`](../../../types/interfaces/EmailResult.md)[]\>

#### Implementation of

[`IEmailProvider`](../../../types/interfaces/IEmailProvider.md).[`sendBulkEmails`](../../../types/interfaces/IEmailProvider.md#sendbulkemails)

***

### sendEmail()

> **sendEmail**(`job`): `Promise`\<[`EmailResult`](../../../types/interfaces/EmailResult.md)\>

Defined in: [src/services/email/providers/SESProvider.ts:98](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SESProvider.ts#L98)

Send a single email using AWS SES

#### Parameters

##### job

[`EmailJob`](../../../types/interfaces/EmailJob.md)

#### Returns

`Promise`\<[`EmailResult`](../../../types/interfaces/EmailResult.md)\>

#### Implementation of

[`IEmailProvider`](../../../types/interfaces/IEmailProvider.md).[`sendEmail`](../../../types/interfaces/IEmailProvider.md#sendemail)
