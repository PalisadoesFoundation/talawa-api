[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/addLanguageTranslation

# Module: resolvers/Mutation/addLanguageTranslation

## Table of contents

### Variables

- [addLanguageTranslation](resolvers_Mutation_addLanguageTranslation.md#addlanguagetranslation)

## Variables

### addLanguageTranslation

• `Const` **addLanguageTranslation**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"addLanguageTranslation"``]

This function adds language translation.

**`Param`**

parent of current request

**`Param`**

payload provided with the request

**`Remarks`**

The following checks are done:
1. If the language exists
2. If the translation already exists.

#### Defined in

[src/resolvers/Mutation/addLanguageTranslation.ts:14](https://github.com/PalisadoesFoundation/talawa-api/blob/ac416c4/src/resolvers/Mutation/addLanguageTranslation.ts#L14)
