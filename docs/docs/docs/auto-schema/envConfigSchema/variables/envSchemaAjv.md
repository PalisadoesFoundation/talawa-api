[Admin Docs](/)

***

# Variable: envSchemaAjv

> `const` **envSchemaAjv**: `EnvSchemaOpt`\[`"ajv"`\]

Defined in: [src/envConfigSchema.ts:331](https://github.com/Sourya07/talawa-api/blob/ead7a48e0174153214ee7311f8b242ee1c1a12ca/src/envConfigSchema.ts#L331)

The `@sinclair/typebox` package doesn't do format validation by itself and requires custom validators for it. The `ajv-formats` package provides this functionality and this object is used to provide the talawa api specific configuration for the `ajv` property accepted by `envSchema` to define those custom format validators.
