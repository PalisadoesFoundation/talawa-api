[API Docs](/)

***

# Interface: SESProviderConfig

Defined in: [src/services/email/providers/SESProvider.ts:6](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SESProvider.ts#L6)

Configuration for AWS SES Email Provider.

## Properties

### accessKeyId?

> `optional` **accessKeyId**: `string`

Defined in: [src/services/email/providers/SESProvider.ts:10](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SESProvider.ts#L10)

AWS Access Key ID. Optional if using default credential chain (e.g. IAM roles).

***

### fromEmail?

> `optional` **fromEmail**: `string`

Defined in: [src/services/email/providers/SESProvider.ts:14](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SESProvider.ts#L14)

Default sender email address.

***

### fromName?

> `optional` **fromName**: `string`

Defined in: [src/services/email/providers/SESProvider.ts:16](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SESProvider.ts#L16)

Default sender display name.

***

### region

> **region**: `string`

Defined in: [src/services/email/providers/SESProvider.ts:8](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SESProvider.ts#L8)

AWS region (e.g., 'us-east-1'). Required.

***

### secretAccessKey?

> `optional` **secretAccessKey**: `string`

Defined in: [src/services/email/providers/SESProvider.ts:12](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SESProvider.ts#L12)

AWS Secret Access Key. Optional if using default credential chain.
