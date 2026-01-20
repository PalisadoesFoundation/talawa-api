[API Docs](/)

***

# Variable: metricsFilterInputSchema

> `const` **metricsFilterInputSchema**: `ZodObject`\<\{ `complexityRange`: `ZodOptional`\<`ZodEffects`\<`ZodObject`\<\{ `max`: `ZodNumber`; `min`: `ZodNumber`; \}, `"strip"`, `ZodTypeAny`, \{ `max`: `number`; `min`: `number`; \}, \{ `max`: `number`; `min`: `number`; \}\>, \{ `max`: `number`; `min`: `number`; \}, \{ `max`: `number`; `min`: `number`; \}\>\>; `minCacheHitRate`: `ZodOptional`\<`ZodNumber`\>; `operationNames`: `ZodOptional`\<`ZodArray`\<`ZodString`, `"many"`\>\>; `slowOperationsOnly`: `ZodDefault`\<`ZodBoolean`\>; \}, `"strip"`, `ZodTypeAny`, \{ `complexityRange?`: \{ `max`: `number`; `min`: `number`; \}; `minCacheHitRate?`: `number`; `operationNames?`: `string`[]; `slowOperationsOnly`: `boolean`; \}, \{ `complexityRange?`: \{ `max`: `number`; `min`: `number`; \}; `minCacheHitRate?`: `number`; `operationNames?`: `string`[]; `slowOperationsOnly?`: `boolean`; \}\>

Defined in: src/graphql/inputs/MetricsFilterInput.ts:51

Zod schema for MetricsFilterInput validation.
Defines advanced filtering options for metrics queries.
