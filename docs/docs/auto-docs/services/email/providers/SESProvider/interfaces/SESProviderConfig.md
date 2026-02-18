[API Docs](/)

***

# Interface: SESProviderConfig

Defined in: [src/services/email/providers/SESProvider.ts:14](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SESProvider.ts#L14)

Configuration for AWS SES Email Provider.

## Properties

### accessKeyId?

> `optional` **accessKeyId**: `string`

Defined in: [src/services/email/providers/SESProvider.ts:18](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SESProvider.ts#L18)

AWS Access Key ID. Optional if using default credential chain (e.g. IAM roles).

***

### fromEmail?

> `optional` **fromEmail**: `string`

Defined in: [src/services/email/providers/SESProvider.ts:22](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SESProvider.ts#L22)

Default sender email address.

***

### fromName?

> `optional` **fromName**: `string`

Defined in: [src/services/email/providers/SESProvider.ts:24](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SESProvider.ts#L24)

Default sender display name.

***

### region

> **region**: [`NonEmptyString`](../../../types/type-aliases/NonEmptyString.md)

Defined in: [src/services/email/providers/SESProvider.ts:16](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SESProvider.ts#L16)

AWS region (e.g., 'us-east-1'). Required.

***

### secretAccessKey?

> `optional` **secretAccessKey**: `string`

Defined in: [src/services/email/providers/SESProvider.ts:20](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SESProvider.ts#L20)

AWS Secret Access Key. Optional if using default credential chain.
