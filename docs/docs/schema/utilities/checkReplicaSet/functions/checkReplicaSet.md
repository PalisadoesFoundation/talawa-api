[**talawa-api**](../../../README.md)

***

# Function: checkReplicaSet()

> **checkReplicaSet**(): `Promise`\<`boolean`\>

Checks if the MongoDB connection is part of a replica set.
This function sends a 'hello' command to the MongoDB admin database to retrieve server information,
and determines if the connection is part of a replica set by checking for the presence of 'hosts' and 'setName' in the result.

## Returns

`Promise`\<`boolean`\>

A promise that resolves to a boolean indicating whether the connection is part of a replica set (true) or not (false).

## Defined in

[src/utilities/checkReplicaSet.ts:11](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/utilities/checkReplicaSet.ts#L11)
