[talawa-api](../README.md) / [Exports](../modules.md) / env

# Module: env

## Table of contents

### Variables

- [envSchema](env.md#envschema)

### Functions

- [getEnvIssues](env.md#getenvissues)

## Variables

### envSchema

• `Const` **envSchema**: `ZodObject`\<\{ `ACCESS_TOKEN_SECRET`: `ZodString` ; `MAIL_PASSWORD`: `ZodString` ; `MAIL_USERNAME`: `ZodString` ; `MONGO_DB_URL`: `ZodString` ; `NODE_ENV`: `ZodDefault`\<`ZodEnum`\<[``"development"``, ``"test"``, ``"production"``]\>\> ; `RECAPTCHA_SECRET_KEY`: `ZodString` ; `RECAPTCHA_SITE_KEY`: `ZodString` ; `REFRESH_TOKEN_SECRET`: `ZodString` ; `apiKey`: `ZodString` ; `appId`: `ZodString` ; `iOSapiKey`: `ZodString` ; `iOSappId`: `ZodString` ; `iOSmessagingSenderId`: `ZodString` ; `iOSprojectId`: `ZodString` ; `iOSstorageBucket`: `ZodString` ; `iosBundleId`: `ZodString` ; `iosClientId`: `ZodString` ; `messagingSenderId`: `ZodString` ; `projectId`: `ZodString` ; `storageBucket`: `ZodString`  }, ``"strip"``, `ZodTypeAny`, \{ `ACCESS_TOKEN_SECRET`: `string` ; `MAIL_PASSWORD`: `string` ; `MAIL_USERNAME`: `string` ; `MONGO_DB_URL`: `string` ; `NODE_ENV`: ``"test"`` \| ``"production"`` \| ``"development"`` ; `RECAPTCHA_SECRET_KEY`: `string` ; `RECAPTCHA_SITE_KEY`: `string` ; `REFRESH_TOKEN_SECRET`: `string` ; `apiKey`: `string` ; `appId`: `string` ; `iOSapiKey`: `string` ; `iOSappId`: `string` ; `iOSmessagingSenderId`: `string` ; `iOSprojectId`: `string` ; `iOSstorageBucket`: `string` ; `iosBundleId`: `string` ; `iosClientId`: `string` ; `messagingSenderId`: `string` ; `projectId`: `string` ; `storageBucket`: `string`  }, \{ `ACCESS_TOKEN_SECRET`: `string` ; `MAIL_PASSWORD`: `string` ; `MAIL_USERNAME`: `string` ; `MONGO_DB_URL`: `string` ; `NODE_ENV?`: ``"test"`` \| ``"production"`` \| ``"development"`` ; `RECAPTCHA_SECRET_KEY`: `string` ; `RECAPTCHA_SITE_KEY`: `string` ; `REFRESH_TOKEN_SECRET`: `string` ; `apiKey`: `string` ; `appId`: `string` ; `iOSapiKey`: `string` ; `iOSappId`: `string` ; `iOSmessagingSenderId`: `string` ; `iOSprojectId`: `string` ; `iOSstorageBucket`: `string` ; `iosBundleId`: `string` ; `iosClientId`: `string` ; `messagingSenderId`: `string` ; `projectId`: `string` ; `storageBucket`: `string`  }\>

#### Defined in

[src/env.ts:3](https://github.com/PalisadoesFoundation/talawa-api/blob/55cb3be/src/env.ts#L3)

## Functions

### getEnvIssues

▸ **getEnvIssues**(): `void` \| `ZodIssue`[]

#### Returns

`void` \| `ZodIssue`[]

#### Defined in

[src/env.ts:35](https://github.com/PalisadoesFoundation/talawa-api/blob/55cb3be/src/env.ts#L35)
