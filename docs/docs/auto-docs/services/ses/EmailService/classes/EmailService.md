[API Docs](/)

***

# Class: EmailService

Defined in: [src/services/ses/EmailService.ts:38](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/ses/EmailService.ts#L38)

Simple email service using AWS SES

## Constructors

### Constructor

> **new EmailService**(`config`): `EmailService`

Defined in: [src/services/ses/EmailService.ts:45](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/ses/EmailService.ts#L45)

#### Parameters

##### config

[`EmailConfig`](../interfaces/EmailConfig.md)

#### Returns

`EmailService`

## Methods

### sendBulkEmails()

> **sendBulkEmails**(`jobs`): `Promise`\<[`EmailResult`](../interfaces/EmailResult.md)[]\>

Defined in: [src/services/ses/EmailService.ts:142](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/ses/EmailService.ts#L142)

Send multiple emails

#### Parameters

##### jobs

[`EmailJob`](../interfaces/EmailJob.md)[]

#### Returns

`Promise`\<[`EmailResult`](../interfaces/EmailResult.md)[]\>

***

### sendEmail()

> **sendEmail**(`job`): `Promise`\<[`EmailResult`](../interfaces/EmailResult.md)\>

Defined in: [src/services/ses/EmailService.ts:100](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/ses/EmailService.ts#L100)

Send a single email using AWS SES

#### Parameters

##### job

[`EmailJob`](../interfaces/EmailJob.md)

#### Returns

`Promise`\<[`EmailResult`](../interfaces/EmailResult.md)\>
