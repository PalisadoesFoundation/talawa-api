[Admin Docs](/)

***

# Type Alias: MembershipRequestType

> **MembershipRequestType**: `object`

Defined in: src/graphql/types/Organization/MembershipRequestObject.ts:6

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
