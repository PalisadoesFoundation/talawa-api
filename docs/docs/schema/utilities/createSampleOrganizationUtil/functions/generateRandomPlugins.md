[Admin Docs](/)

***

# Function: generateRandomPlugins()

> **generateRandomPlugins**(`numberOfPlugins`, `users`): `Promise`\<`Promise`\<`any`\>[]\>

Generates random plugin data for a given number of plugins and list of users.

## Parameters

### numberOfPlugins

`number`

The number of plugins to create

### users

`string`[]

The list of users associated with the plugins

## Returns

`Promise`\<`Promise`\<`any`\>[]\>

A promise that resolves to an array of promises for created plugins

## Defined in

[src/utilities/createSampleOrganizationUtil.ts:231](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/utilities/createSampleOrganizationUtil.ts#L231)
