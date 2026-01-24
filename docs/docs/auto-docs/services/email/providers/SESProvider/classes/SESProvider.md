[**talawa-api**](../../../../../README.md)

***

# Class: SESProvider

Defined in: [src/services/email/providers/SESProvider.ts:32](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/services/email/providers/SESProvider.ts#L32)

AWS SES implementation of IEmailProvider.

This provider uses the @aws-sdk/client-ses to send emails.
It lazily initializes the SESClient and Command constructors on first use.

## Implements

- [`IEmailProvider`](../../../types/interfaces/IEmailProvider.md)

## Constructors

### Constructor

> **new SESProvider**(`config`): `SESProvider`

Defined in: [src/services/email/providers/SESProvider.ts:43](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/services/email/providers/SESProvider.ts#L43)

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

Defined in: [src/services/email/providers/SESProvider.ts:145](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/services/email/providers/SESProvider.ts#L145)

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

Defined in: [src/services/email/providers/SESProvider.ts:103](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/services/email/providers/SESProvider.ts#L103)

Send a single email using AWS SES

#### Parameters

##### job

[`EmailJob`](../../../types/interfaces/EmailJob.md)

#### Returns

`Promise`\<[`EmailResult`](../../../types/interfaces/EmailResult.md)\>

#### Implementation of

[`IEmailProvider`](../../../types/interfaces/IEmailProvider.md).[`sendEmail`](../../../types/interfaces/IEmailProvider.md#sendemail)
