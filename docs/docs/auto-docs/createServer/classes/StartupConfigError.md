[API Docs](/)

***

# Class: StartupConfigError

Defined in: [src/createServer.ts:38](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/createServer.ts#L38)

Error thrown during process startup when critical configuration is missing or
still set to the placeholder sentinel (`PLACEHOLDER_SENTINEL`).

## Extends

- `Error`

## Constructors

### Constructor

> **new StartupConfigError**(`message`): `StartupConfigError`

Defined in: [src/createServer.ts:39](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/createServer.ts#L39)

#### Parameters

##### message

`string`

#### Returns

`StartupConfigError`

#### Overrides

`Error.constructor`
