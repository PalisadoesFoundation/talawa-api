[Admin Docs](/)

***

# Variable: envSchemaAjv

> `const` **envSchemaAjv**: `EnvSchemaOpt`\[`"ajv"`\]

Defined in: [src/envConfigSchema.ts:311](https://github.com/PurnenduMIshra129th/talawa-api/blob/6dd1cb0af1891b88aa61534ec8a6180536cd264f/src/envConfigSchema.ts#L311)

The `@sinclair/typebox` package doesn't do format validation by itself and requires custom validators for it. The `ajv-formats` package provides this functionality and this object is used to provide the talawa api specific configuration for the `ajv` property accepted by `envSchema` to define those custom format validators.
