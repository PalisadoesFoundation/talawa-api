[API Docs](/)

***

# Variable: metricsInputSchema

> `const` **metricsInputSchema**: `ZodEffects`\<`ZodObject`\<\{ `endTime`: `ZodDate`; `includeCacheMetrics`: `ZodDefault`\<`ZodBoolean`\>; `maxDuration`: `ZodOptional`\<`ZodNumber`\>; `minDuration`: `ZodOptional`\<`ZodNumber`\>; `operationType`: `ZodOptional`\<`ZodString`\>; `startTime`: `ZodDate`; \}, `"strip"`, `ZodTypeAny`, \{ `endTime`: `Date`; `includeCacheMetrics`: `boolean`; `maxDuration?`: `number`; `minDuration?`: `number`; `operationType?`: `string`; `startTime`: `Date`; \}, \{ `endTime`: `Date`; `includeCacheMetrics?`: `boolean`; `maxDuration?`: `number`; `minDuration?`: `number`; `operationType?`: `string`; `startTime`: `Date`; \}\>, \{ `endTime`: `Date`; `includeCacheMetrics`: `boolean`; `maxDuration?`: `number`; `minDuration?`: `number`; `operationType?`: `string`; `startTime`: `Date`; \}, \{ `endTime`: `Date`; `includeCacheMetrics?`: `boolean`; `maxDuration?`: `number`; `minDuration?`: `number`; `operationType?`: `string`; `startTime`: `Date`; \}\>

Defined in: [src/graphql/inputs/MetricsInput.ts:9](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/inputs/MetricsInput.ts#L9)

Zod schema for MetricsInput validation.
Defines the input structure for querying metrics data.
