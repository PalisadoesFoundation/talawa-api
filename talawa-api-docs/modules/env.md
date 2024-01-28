[talawa-api](../README.md) / [Exports](../modules.md) / env

# Module: env

## Table of contents

### Variables

- [envSchema](env.md#envschema)

### Functions

- [getEnvIssues](env.md#getenvissues)

## Variables

### envSchema

• `Const` **envSchema**: `ZodObject`\<\{ `ACCESS_TOKEN_SECRET`: `ZodString` ; `COLORIZE_LOGS`: `ZodOptional`\<`ZodEffects`\<`ZodString`, `string`, `string`\>\> ; `IS_SMTP`: `ZodOptional`\<`ZodEffects`\<`ZodString`, `string`, `string`\>\> ; `LAST_RESORT_SUPERADMIN_EMAIL`: `ZodOptional`\<`ZodString`\> ; `LOG_LEVEL`: `ZodEnum`\<[``"trace"``, ``"debug"``, ``"info"``, ``"warn"``, ``"error"``, ``"fatal"``]\> ; `MAIL_PASSWORD`: `ZodOptional`\<`ZodString`\> ; `MAIL_USERNAME`: `ZodOptional`\<`ZodString`\> ; `MONGO_DB_URL`: `ZodString` ; `NODE_ENV`: `ZodEffects`\<`ZodString`, `string`, `string`\> ; `RECAPTCHA_SECRET_KEY`: `ZodOptional`\<`ZodString`\> ; `REDIS_HOST`: `ZodString` ; `REDIS_PASSWORD`: `ZodOptional`\<`ZodString`\> ; `REDIS_PORT`: `ZodEffects`\<`ZodString`, `string`, `string`\> ; `REFRESH_TOKEN_SECRET`: `ZodString` ; `SMTP_HOST`: `ZodOptional`\<`ZodString`\> ; `SMTP_PASSWORD`: `ZodOptional`\<`ZodString`\> ; `SMTP_PORT`: `ZodOptional`\<`ZodString`\> ; `SMTP_SSL_TLS`: `ZodOptional`\<`ZodEffects`\<`ZodString`, `string`, `string`\>\> ; `SMTP_USERNAME`: `ZodOptional`\<`ZodString`\>  }, ``"strip"``, `ZodTypeAny`, \{ `ACCESS_TOKEN_SECRET`: `string` ; `COLORIZE_LOGS?`: `string` ; `IS_SMTP?`: `string` ; `LAST_RESORT_SUPERADMIN_EMAIL?`: `string` ; `LOG_LEVEL`: ``"info"`` \| ``"error"`` \| ``"warn"`` \| ``"trace"`` \| ``"debug"`` \| ``"fatal"`` ; `MAIL_PASSWORD?`: `string` ; `MAIL_USERNAME?`: `string` ; `MONGO_DB_URL`: `string` ; `NODE_ENV`: `string` ; `RECAPTCHA_SECRET_KEY?`: `string` ; `REDIS_HOST`: `string` ; `REDIS_PASSWORD?`: `string` ; `REDIS_PORT`: `string` ; `REFRESH_TOKEN_SECRET`: `string` ; `SMTP_HOST?`: `string` ; `SMTP_PASSWORD?`: `string` ; `SMTP_PORT?`: `string` ; `SMTP_SSL_TLS?`: `string` ; `SMTP_USERNAME?`: `string`  }, \{ `ACCESS_TOKEN_SECRET`: `string` ; `COLORIZE_LOGS?`: `string` ; `IS_SMTP?`: `string` ; `LAST_RESORT_SUPERADMIN_EMAIL?`: `string` ; `LOG_LEVEL`: ``"info"`` \| ``"error"`` \| ``"warn"`` \| ``"trace"`` \| ``"debug"`` \| ``"fatal"`` ; `MAIL_PASSWORD?`: `string` ; `MAIL_USERNAME?`: `string` ; `MONGO_DB_URL`: `string` ; `NODE_ENV`: `string` ; `RECAPTCHA_SECRET_KEY?`: `string` ; `REDIS_HOST`: `string` ; `REDIS_PASSWORD?`: `string` ; `REDIS_PORT`: `string` ; `REFRESH_TOKEN_SECRET`: `string` ; `SMTP_HOST?`: `string` ; `SMTP_PASSWORD?`: `string` ; `SMTP_PORT?`: `string` ; `SMTP_SSL_TLS?`: `string` ; `SMTP_USERNAME?`: `string`  }\>

#### Defined in

[src/env.ts:3](https://github.com/PalisadoesFoundation/talawa-api/blob/0075fca/src/env.ts#L3)

## Functions

### getEnvIssues

▸ **getEnvIssues**(): `void` \| `ZodIssue`[]

#### Returns

`void` \| `ZodIssue`[]

#### Defined in

[src/env.ts:36](https://github.com/PalisadoesFoundation/talawa-api/blob/0075fca/src/env.ts#L36)
