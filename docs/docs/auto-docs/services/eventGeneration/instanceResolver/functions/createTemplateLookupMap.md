[API Docs](/)

***

# Function: createTemplateLookupMap()

> **createTemplateLookupMap**(`templates`): `Map`\<`string`, `object` & `object`\>

Defined in: [src/services/eventGeneration/instanceResolver.ts:253](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/eventGeneration/instanceResolver.ts#L253)

Creates a lookup map for event templates to enable efficient batch processing.
The map is keyed by the event template ID.

## Parameters

### templates

`object` & `object`[]

An array of event templates.

## Returns

`Map`\<`string`, `object` & `object`\>

- A map of templates, keyed by their IDs.
