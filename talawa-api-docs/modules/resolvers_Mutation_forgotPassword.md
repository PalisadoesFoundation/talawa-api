[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/forgotPassword

# Module: resolvers/Mutation/forgotPassword

## Table of contents

### Variables

- [forgotPassword](resolvers_Mutation_forgotPassword.md#forgotpassword)

## Variables

### forgotPassword

• `Const` **forgotPassword**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"forgotPassword"``]

This function enables a user to restore password.

**`Param`**

parent of current request

**`Param`**

payload provided with the request

**`Remarks`**

The following tasks are done:
1. Extracts email and otp out of otpToken.
2. Compares otpToken and otp.
3. Checks whether otp is valid.
4. Updates password field for user's document with email === email.

#### Defined in

[src/resolvers/Mutation/forgotPassword.ts:17](https://github.com/PalisadoesFoundation/talawa-api/blob/c199cfb/src/resolvers/Mutation/forgotPassword.ts#L17)
