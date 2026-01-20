[API Docs](/)

***

# Interface: SESProviderConfig

Defined in: src/services/email/providers/SESProvider.ts:11

Configuration for AWS SES Email Provider.

## Properties

### accessKeyId?

> `optional` **accessKeyId**: `string`

Defined in: src/services/email/providers/SESProvider.ts:15

AWS Access Key ID. Optional if using default credential chain (e.g. IAM roles).

***

### fromEmail?

> `optional` **fromEmail**: `string`

Defined in: src/services/email/providers/SESProvider.ts:19

Default sender email address.

***

### fromName?

> `optional` **fromName**: `string`

Defined in: src/services/email/providers/SESProvider.ts:21

Default sender display name.

***

### region

> **region**: [`NonEmptyString`](../../../types/type-aliases/NonEmptyString.md)

Defined in: src/services/email/providers/SESProvider.ts:13

AWS region (e.g., 'us-east-1'). Required.

***

### secretAccessKey?

> `optional` **secretAccessKey**: `string`

Defined in: src/services/email/providers/SESProvider.ts:17

AWS Secret Access Key. Optional if using default credential chain.
