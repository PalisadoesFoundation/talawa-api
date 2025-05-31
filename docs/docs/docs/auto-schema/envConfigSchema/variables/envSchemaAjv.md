[Admin Docs](/)

***

# Variable: envSchemaAjv

> `const` **envSchemaAjv**: `EnvSchemaOpt`\[`"ajv"`\]

Defined in: [src/envConfigSchema.ts:298](https://github.com/PalisadoesFoundation/talawa-api/blob/b92360e799fdc7cf89a1346eb8395735c501ee9c/src/envConfigSchema.ts#L298)

The `@sinclair/typebox` package doesn't do format validation by itself and requires custom validators for it. The `ajv-formats` package provides this functionality and this object is used to provide the talawa api specific configuration for the `ajv` property accepted by `envSchema` to define those custom format validators.
