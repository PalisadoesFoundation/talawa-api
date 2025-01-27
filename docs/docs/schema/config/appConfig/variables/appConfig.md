[**talawa-api**](../../../README.md)

***

# Variable: appConfig

> `const` **appConfig**: `object`

Application configuration settings.
This object contains various configuration options for the application.

## Type declaration

### colorize\_logs

> **colorize\_logs**: `string` = `process.env.COLORIZE_LOGS`

Determines if logs should be colorized.

### defaultLocale

> **defaultLocale**: `string` = `"en"`

The default language for the application.

### env

> **env**: `string` = `process.env.NODE_ENV`

The current environment of the application (e.g., 'development', 'production').

### log\_level

> **log\_level**: `string` = `process.env.LOG_LEVEL`

The logging level for the application (e.g., 'info', 'error').

### supportedLocales

> **supportedLocales**: `string`[]

An array of supported language for the application.

## Defined in

[src/config/appConfig.ts:5](https://github.com/Suyash878/talawa-api/blob/095e6964ce2a06c1c30d1acf81b6162203f1db91/src/config/appConfig.ts#L5)
