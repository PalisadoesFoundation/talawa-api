[Admin Docs](/)

***

# Variable: envSchemaAjv

> `const` **envSchemaAjv**: `EnvSchemaOpt`\[`"ajv"`\]

Defined in: [src/envConfigSchema.ts:246](https://github.com/Suyash878/talawa-api/blob/dd80c416ddd46afdb07c628dc824194bc09930cc/src/envConfigSchema.ts#L246)

The `@sinclair/typebox` package doesn't do format validation by itself and requires custom validators for it. The `ajv-formats` package provides this functionality and this object is used to provide the talawa api specific configuration for the `ajv` property accepted by `envSchema` to define those custom format validators.
