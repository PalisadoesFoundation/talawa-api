[Admin Docs](/)

***

# Type Alias: MembershipRequestType

> **MembershipRequestType**: `object`

Defined in: [src/graphql/types/Organization/MembershipRequestObject.ts:5](https://github.com/NishantSinghhhhh/talawa-api/blob/d7e8fb10f99b66342acb17768b9755553b21ad54/src/graphql/types/Organization/MembershipRequestObject.ts#L5)

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
