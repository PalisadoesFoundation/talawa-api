[Admin Docs](/)

***

# Type Alias: MembershipRequestType

> **MembershipRequestType** = `object`

Defined in: [src/graphql/types/Organization/MembershipRequestObject.ts:6](https://github.com/PurnenduMIshra129th/talawa-api/blob/75f0e499b44e2c3bed70cf951ac8ac374317f43b/src/graphql/types/Organization/MembershipRequestObject.ts#L6)

## Properties

### createdAt

> **createdAt**: `Date`

Defined in: [src/graphql/types/Organization/MembershipRequestObject.ts:20](https://github.com/PurnenduMIshra129th/talawa-api/blob/75f0e499b44e2c3bed70cf951ac8ac374317f43b/src/graphql/types/Organization/MembershipRequestObject.ts#L20)

Timestamp when the membership request was created

***

### membershipRequestId

> **membershipRequestId**: `string`

Defined in: [src/graphql/types/Organization/MembershipRequestObject.ts:8](https://github.com/PurnenduMIshra129th/talawa-api/blob/75f0e499b44e2c3bed70cf951ac8ac374317f43b/src/graphql/types/Organization/MembershipRequestObject.ts#L8)

Unique identifier for the membership request

***

### organizationId

> **organizationId**: `string`

Defined in: [src/graphql/types/Organization/MembershipRequestObject.ts:14](https://github.com/PurnenduMIshra129th/talawa-api/blob/75f0e499b44e2c3bed70cf951ac8ac374317f43b/src/graphql/types/Organization/MembershipRequestObject.ts#L14)

ID of the organization the user is requesting to join

***

### status

> **status**: *typeof* [`MembershipRequestStatusValues`](../../../../../drizzle/enums/membershipRequestStatus/variables/MembershipRequestStatusValues.md)\[`number`\]

Defined in: [src/graphql/types/Organization/MembershipRequestObject.ts:17](https://github.com/PurnenduMIshra129th/talawa-api/blob/75f0e499b44e2c3bed70cf951ac8ac374317f43b/src/graphql/types/Organization/MembershipRequestObject.ts#L17)

Status of the membership request (e.g., pending, approved, rejected)

***

### userId

> **userId**: `string`

Defined in: [src/graphql/types/Organization/MembershipRequestObject.ts:11](https://github.com/PurnenduMIshra129th/talawa-api/blob/75f0e499b44e2c3bed70cf951ac8ac374317f43b/src/graphql/types/Organization/MembershipRequestObject.ts#L11)

ID of the user who requested membership
