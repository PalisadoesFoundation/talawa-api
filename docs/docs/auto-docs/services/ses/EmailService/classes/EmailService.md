[API Docs](/)

***

# Class: EmailService

Defined in: [src/services/ses/EmailService.ts:52](https://github.com/PalisadoesFoundation/talawa-api/tree/main/src/services/ses/EmailService.ts#L52)

Simple email service using AWS SES

## Constructors

### Constructor

> **new EmailService**(`config`): `EmailService`

Defined in: [src/services/ses/EmailService.ts:57](https://github.com/PalisadoesFoundation/talawa-api/tree/main/src/services/ses/EmailService.ts#L57)

#### Parameters

##### config

[`EmailConfig`](../interfaces/EmailConfig.md)

#### Returns

`EmailService`

## Methods

### sendBulkEmails()

> **sendBulkEmails**(`jobs`): `Promise`\<[`EmailResult`](../interfaces/EmailResult.md)[]\>

Defined in: [src/services/ses/EmailService.ts:151](https://github.com/PalisadoesFoundation/talawa-api/tree/main/src/services/ses/EmailService.ts#L151)

Send multiple emails

#### Parameters

##### jobs

[`EmailJob`](../interfaces/EmailJob.md)[]

#### Returns

`Promise`\<[`EmailResult`](../interfaces/EmailResult.md)[]\>

***

### sendEmail()

> **sendEmail**(`job`): `Promise`\<[`EmailResult`](../interfaces/EmailResult.md)\>

Defined in: [src/services/ses/EmailService.ts:111](https://github.com/PalisadoesFoundation/talawa-api/tree/main/src/services/ses/EmailService.ts#L111)

Send a single email using AWS SES

#### Parameters

##### job

[`EmailJob`](../interfaces/EmailJob.md)

#### Returns

`Promise`\<[`EmailResult`](../interfaces/EmailResult.md)\>
