[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Query/organizations

# Module: resolvers/Query/organizations

## Table of contents

### Variables

- [organizations](resolvers_Query_organizations.md#organizations)

## Variables

### organizations

• `Const` **organizations**: [`QueryResolvers`](types_generatedGraphQLTypes.md#queryresolvers)[``"organizations"``]

If a 'id' is specified, this query will return an organisation;
otherwise, it will return all organisations with a size of limit 100.

**`Param`**

**`Param`**

An object containing `orderBy` and `id` of the Organization.

**`Remarks`**

`id` in the args is optional.

#### Defined in

[src/resolvers/Query/organizations.ts:16](https://github.com/PalisadoesFoundation/talawa-api/blob/4145524/src/resolvers/Query/organizations.ts#L16)
