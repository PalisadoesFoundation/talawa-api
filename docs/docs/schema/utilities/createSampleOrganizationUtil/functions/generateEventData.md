[**talawa-api**](../../../README.md)

***

# Function: generateEventData()

> **generateEventData**(`users`, `organizationId`): `Promise`\<[`InterfaceEvent`](../../../models/Event/interfaces/InterfaceEvent.md)\>

Generates event data for a given list of users and organization.

## Parameters

### users

[`InterfaceUser`](../../../models/User/interfaces/InterfaceUser.md)[]

The list of users associated with the event

### organizationId

`string`

The ID of the organization the event belongs to

## Returns

`Promise`\<[`InterfaceEvent`](../../../models/Event/interfaces/InterfaceEvent.md)\>

A promise that resolves to the created event

## Defined in

[src/utilities/createSampleOrganizationUtil.ts:88](https://github.com/Suyash878/talawa-api/blob/095e6964ce2a06c1c30d1acf81b6162203f1db91/src/utilities/createSampleOrganizationUtil.ts#L88)
