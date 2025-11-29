---
id: rate-limiting
title: Rate Limiting
slug: /developer-resources/rate-limiting
sidebar_position: 50
---

# Rate Limiting in GraphQL API

## Overview
This section outlines the approach used to calculate query costs and enforce rate limits in our GraphQL API. We leverage the **Pothos Complexity Plugin** to assign complexity values to each field and use the **Leaky Bucket Algorithm** for rate limiting.

## Rate Limiting Levels
Rate limiting is implemented at two broad levels:

### 1. Web Server Level (Global Rate Limiting)
**Purpose:**
- Focuses on total incoming requests from the client.
- Helps prevent abuse, ensures fair usage, and protects the server from being overwhelmed by excessive requests.
- Prevents DDoS attacks and ensures stable server performance.

**Implementation:**
- Implemented using web server software or middleware.
- The number of total requests is calculated based on server capacity, database capacity, and other backend resources.

### 2. API Level (User-Specific Rate Limiting)
**Purpose:**
- Ensures that no single user monopolizes resources.
- Particularly useful for GraphQL APIs where queries have varying complexities and resource intensities.

**Implementation:**
- Each query’s cost is calculated based on the complexity of the requested data and nesting depth.
- If a query’s cost exceeds the user’s quota, it is denied.
- The user’s quota refills at a specific rate using the **Leaky Bucket Algorithm**.
- User tracking is done via IP addresses.

## Problems with Traditional HTTP Rate Limiting
While traditional HTTP rate limiting is effective for limiting the number of requests from a client, it has several limitations:
1. **Uniform Request Cost Assumption** – All requests are treated equally, even though some queries consume significantly more resources than others.
2. **Lack of Query Complexity Awareness** – HTTP rate limiting does not account for query depth or computational cost, leading to inefficient resource allocation.
3. **Ineffective Against Costly Queries** – Users can send fewer but highly complex queries that still overwhelm the system.
4. **Fixed Request Limits** – Simple request-count-based limiting does not accommodate dynamic workloads or API-specific constraints.


## Query Cost Calculation

### Methodology
1. Explicitly assign a complexity value to each GraphQL field.
2. Scalar fields use a default cost assigned in the plugin configuration.
3. Object and list fields have assigned complexity costs, with additional costs for mutations.
4. Total query complexity is computed **before execution** to determine the cost.

### Why Pre-Execution Phase?
- At this phase, the query syntax is already validated and exists in the GraphQL schema.
- Complexity can be safely computed without processing invalid queries.
- If the query’s cost exceeds the user's quota, an error is thrown before execution.

## GraphQL Request Lifecycle
```
Incoming GraphQL Request
  │
  └─▶ Routing
           │
  errors ◀─┴─▶ preParsing Hook
                  │
         errors ◀─┴─▶ Parsing
                        │
               errors ◀─┴─▶ preValidation Hook
                               │
                      errors ◀─┴─▶ Validation
                                     │
                            errors ◀─┴─▶ preExecution Hook
                                            │
                                   errors ◀─┴─▶ Execution
                                                  │
                                         errors ◀─┴─▶ Resolution
                                                        │
                                                        └─▶ onResolution Hook
```

## User Identification for Rate Limiting
To enforce rate limits, we track user-specific quotas in Redis:
- **Authenticated Users:** Identified using a combination of IP address and User ID.
  - Redis key: `rate-limit:user:ip`
- **Unauthenticated Users:** Identified using only the IP address.
  - Redis key: `rate-limit:ip`

## Rate Limiting Using the Leaky Bucket Algorithm

### Implementation Details
- The **Leaky Bucket Algorithm** controls query execution rate.
- The bucket size and leak rate are configurable.
- Each query's cost is deducted from the user’s available quota.
- The quota refills over time to ensure fair resource allocation.

### How Cost is Deducted and Refilled

1. **Deduction Process**
   - Each time a user makes a GraphQL request, the total cost of the query is calculated.
   - If the cost does not exceed the available quota, it is deducted from the user’s remaining quota.
   - If the cost **exceeds the available quota**, the request is denied with an error.

2. **Refilling Process**
   - The quota refills gradually over time, following the **Leaky Bucket Algorithm**.
   - The refill rate is predefined (e.g., 10 points per second).
   - This ensures that users can send continuous requests at a controlled rate rather than consuming the entire quota at once.

3. **Example of Quota Behavior**
   - Assume a user has a quota of **50 points**.
   - The user sends a query with a cost of **20 points** → Remaining quota = **30**.
   - The user sends another query with a cost of **40 points** → Request **denied** (exceeds quota).
   - After 5 seconds (with a refill rate of 10 points/sec), the quota is restored to **50 points**, allowing further requests.

### Error Handling
- If the query cost exceeds the available quota, an error is returned.
- Users can retry requests once their quota refills over time.

## Environment Variables for Query Cost Configuration

| Environment Variable | Description |
|----------------------|-------------|
| `API_GRAPHQL_SCALAR_FIELD_COST` | Cost assigned to scalar fields such as `id`, `name`, etc. |
| `API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST` | Cost for scalar fields that require resolver logic. |
| `API_GRAPHQL_OBJECT_FIELD_COST` | Cost for object fields that return nested objects. |
| `API_GRAPHQL_LIST_FIELD_COST` | Cost for list fields that return an array of objects. |
| `API_GRAPHQL_NON_PAGINATED_LIST_FIELD_COST` | Higher cost for non-paginated lists to prevent large queries. |
| `API_GRAPHQL_MUTATION_BASE_COST` | Base cost for mutations, since they modify data. |
| `API_GRAPHQL_SUBSCRIPTION_BASE_COST` | Base cost for subscriptions, due to continuous real-time updates. |

These variables define how query complexity is calculated and ensure fair API usage.

## Example Queries

### Simple Query
```graphql
query GetUserProfile {
  user(id: "123") {
    id
    name
    email
  }
}
```
- **Complexity Calculation:**
  - `user`: 1 (object field)
  - `id`: 0 (scalar field)
  - `name`: 0 (scalar field)
  - `email`: 0 (scalar field)
  - **Total Cost: 1**

### Nested Query
```graphql
query GetUserWithCreator {
  user(id: "123") {
    id
    name
    creator {
      id
      name
    }
  }
}
```
- **Complexity Calculation:**
  - `user`: 1 (object field)
  - `id`: 0 (scalar field)
  - `name`: 0 (scalar field)
  - `creator`: 1 (object field)
  - `id` (inside creator): 0 (scalar field)
  - `name` (inside creator): 0 (scalar field)
  - **Total Cost: 1 + 1 = 2**

### Relay-Based Nested Query
```graphql
query GetUserWithOrganizations {
  signIn(input: { emailAddress: "testsuperadmin@example.com", password: "Pass@123" }) {
    user {
      id
      organizationsWhereMember(first: 5, after: null) {
        pageInfo {
          hasPreviousPage
        }
        edges {
          cursor
          node {
            id
          }
        }
      }
    }
    authenticationToken
  }
}
```
- **Complexity Calculation:**
  - `user`: 1 (object field)
  - `organizationsWhereMember`: 1 (list field)
  - `edges`: 2 (object field)
  - `edges` fetched 5 times: 5 * 2 = 10
  - **Total Cost: 1 + 1 + 10 = 12**
  - `pageInfo` is treated as a scalar and does not add to the cost because it is calculated every time regardless of whether the user requests it or not. Since it is an inherent part of pagination logic, including it in cost calculation would unfairly penalize users for standard pagination behavior.

### Simple Mutation
```graphql
mutation CreatePost {
  createPost(input: { title: "GraphQL Rate Limiting", content: "Understanding cost-based rate limiting." }) {
    id
    title
    content
  }
}
```
- **Complexity Calculation:**
  - `createPost`: **10** (mutation base cost)
  - `id`: 0 (scalar field)
  - `title`: 0 (scalar field)
  - `content`: 0 (scalar field)
  - **Total Cost: 10**

## References
- [GitHub GraphQL API Rate Limits](https://docs.github.com/en/graphql/overview/rate-limits-and-node-limits-for-the-graphql-api)
- [Shopify Engineering - Rate Limiting GraphQL APIs](https://shopify.engineering/rate-limiting-graphql-apis-calculating-query-complexity)
- [GraphQL API Gateway Patterns - Complexity-Based Rate Limiting](https://graphql-api-gateway.com/graphql-api-gateway-patterns/complexity-based-rate-limiting-quotas)
- [A Guide to GraphQL Rate Limiting & Security](https://medium.com/@xuorig/a-guide-to-graphql-rate-limiting-security-e62a86ef8114)

