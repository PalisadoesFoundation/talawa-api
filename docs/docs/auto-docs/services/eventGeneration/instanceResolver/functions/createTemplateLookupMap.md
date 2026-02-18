[API Docs](/)

***

# Function: createTemplateLookupMap()

> **createTemplateLookupMap**(`templates`): `Map`\<`string`, [`EventTemplateWithAttachments`](../../types/type-aliases/EventTemplateWithAttachments.md)\>

Defined in: [src/services/eventGeneration/instanceResolver.ts:250](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/eventGeneration/instanceResolver.ts#L250)

Creates a lookup map for event templates to enable efficient batch processing.
The map is keyed by the event template ID.

## Parameters

### templates

[`EventTemplateWithAttachments`](../../types/type-aliases/EventTemplateWithAttachments.md)[]

An array of event templates.

## Returns

`Map`\<`string`, [`EventTemplateWithAttachments`](../../types/type-aliases/EventTemplateWithAttachments.md)\>

- A map of templates, keyed by their IDs.
