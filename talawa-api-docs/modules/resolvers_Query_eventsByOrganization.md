[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Query/eventsByOrganization

# Module: resolvers/Query/eventsByOrganization

## Table of contents

### Variables

- [eventsByOrganization](resolvers_Query_eventsByOrganization.md#eventsbyorganization)

## Variables

### eventsByOrganization

• `Const` **eventsByOrganization**: [`QueryResolvers`](types_generatedGraphQLTypes.md#queryresolvers)[``"eventsByOrganization"``]

This query will fetch all events for the organization which have `ACTIVE` status from database.

**`Param`**

**`Param`**

An object that contains `orderBy` to sort the object as specified and `id` of the Organization.

#### Defined in

[src/resolvers/Query/eventsByOrganization.ts:10](https://github.com/PalisadoesFoundation/talawa-api/blob/0763f35/src/resolvers/Query/eventsByOrganization.ts#L10)
