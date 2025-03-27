[Admin Docs](/)

***

# Type Alias: MembershipRequestType

> **MembershipRequestType**: `object`

Defined in: [src/graphql/types/Organization/MembershipRequestObject.ts:5](https://github.com/NishantSinghhhhh/talawa-api/blob/cecfd40a68e5e0e9c8a0b8efd045a3c4381a2c01/src/graphql/types/Organization/MembershipRequestObject.ts#L5)

## Type declaration

### createdAt

> **createdAt**: `Date`

Timestamp when the membership request was created

### membershipRequestId

> **membershipRequestId**: `string`

Unique identifier for the membership request

### organizationId

> **organizationId**: `string`

ID of the organization the user is requesting to join

### status

> **status**: *typeof* [`MembershipRequestStatusValues`](../../../../../drizzle/enums/membershipRequestStatus/variables/MembershipRequestStatusValues.md)\[`number`\]

Status of the membership request (e.g., pending, approved, rejected)

### userId

> **userId**: `string`

ID of the user who requested membership
