[**talawa-api**](../../../../README.md)

***

# Class: EmailQueueProcessor

Defined in: [src/services/email/EmailQueueProcessor.ts:11](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/services/email/EmailQueueProcessor.ts#L11)

Simple email queue processor that processes pending emails

## Constructors

### Constructor

> **new EmailQueueProcessor**(`emailService`, `ctx`): `EmailQueueProcessor`

Defined in: [src/services/email/EmailQueueProcessor.ts:17](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/services/email/EmailQueueProcessor.ts#L17)

#### Parameters

##### emailService

[`IEmailProvider`](../../types/interfaces/IEmailProvider.md)

##### ctx

`Pick`\<[`GraphQLContext`](../../../../graphql/context/type-aliases/GraphQLContext.md), `"drizzleClient"` \| `"log"`\>

#### Returns

`EmailQueueProcessor`

## Methods

### processPendingEmails()

> **processPendingEmails**(): `Promise`\<`void`\>

Defined in: [src/services/email/EmailQueueProcessor.ts:28](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/services/email/EmailQueueProcessor.ts#L28)

Process pending emails from the queue

#### Returns

`Promise`\<`void`\>

***

### startBackgroundProcessing()

> **startBackgroundProcessing**(`intervalMs`): `void`

Defined in: [src/services/email/EmailQueueProcessor.ts:145](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/services/email/EmailQueueProcessor.ts#L145)

Start background processor - simple setInterval approach

#### Parameters

##### intervalMs

`number` = `30000`

#### Returns

`void`

***

### stopBackgroundProcessing()

> **stopBackgroundProcessing**(): `void`

Defined in: [src/services/email/EmailQueueProcessor.ts:157](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/services/email/EmailQueueProcessor.ts#L157)

#### Returns

`void`
