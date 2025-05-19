---
id: pagination
title: GraphQL Filtering & Pagination
slug: /developer-resources/graphql-filtering
sidebar_position: 4
---

## Pagination using graphQL connections

Connections in graphQL are an approach to pagination popularized by relay client, the graphQL library developed by meta for managing graphQL state on the client applications and its server specification for designing graphQL schema. Though this specification specifically caters towards relay because the library is opinionated about certain patterns for data fetching with graphQL, these schema design principles are not limited to relay and are actually quite ingenious such that they became kind of a best pratice in graphQL ecosystem for implementing a performant pagination system. Here are some resources to learn more about relay style graphQL connections

1. [Global Object Identification](https://graphql.org/learn/global-object-identification/)
2. [Relay GraphQL Server Specification](https://relay.dev/docs/guides/graphql-server-specification/)
3. [Relay Connections](https://relay.dev/graphql/connections.htm)

<br />

## Two rules to keep in mind 

Both these rules are essential to maintain uniformity in the implementations for pagination in talawa

1. Talawa applications strictly only implement relay style connections for its pagination needs. Any new implementations for pagination in talawa-api must also conform to relay style connections.

2. All connections that need to provide filtering and sorting capabilities must conform to the graphQL schema design described below in this document.

<br />

## Filtering and sorting on graphQL connections

The relay server specification for graphQL connections doesn't mention anything about filtering and sorting on connections because the relay graphQL client library doesn't concern itself with filtering and sorting the connections. Allowing filtering and sorting on a connection is like requesting an entirely new connection each time we change a filter or sort parameter because positions of the connection edges can no longer be predicted by the virtue of their cursors. This is a custom feature that has to be implemented and maintained both on the client and server side.

Since there are no community standards for filtering or sorting on graphQL connections, here we're specifying our own standards that should be followed by developers contributing to talawa-api.

1. Connections that want to provide filtering capabilities should expose a field named `where` as an argument on the connection.

2. Connections that want to provide sorting capabilities should expose a field named `sortedBy` as an argument on the connection.

3. Connections that want to provide both filtering and sorting capabilities should expose both the fields `where` and `sortedBy` as arguments on the connection.

The `where` and `sortedBy` arguments should have strictly defined graphQL schema types that pertain to filtering and sorting logic allowed on the connection they exist on.

The `where` field should be a graphQL input that should be named according to syntax `<capitalized_parent_type><capitalized_connection_name>WhereInput`. So, for `User.posts` it will be named `UserPostsWhereInput` and for `Query.posts` it will be named `QueryPostsWhereInput`. Each field we want to allow filtering on should be defined in this input type. Each field should be a graphQL input that specifies all filter actions allowed for that field. If we want to allow filtering on fields that exist on a nested structure within the connection's domain model, then we follow the previous approach recursively for all such fields.

The `sortedBy` field should be graphQL input that should be named according to syntax `<capitalized_parent_type><capitalized_connection_name>SortedByInput`. So, for `User.posts` it will be named `UserPostsSortedByInput` and for `Query.posts` it will be named `QueryPostsSortedByInput`. Since, it doesn't make sense to allow sorting on more than one field in one request, each of these inputs should be annotated with graphQL's `oneOf` directive so that only one of the sort fields could be used at any time. Each field we want to allow sorting on should be defined in this input type. Each field should be the graphQL enum `SortedByOrder` that specifies the sort order for that field. If we want to allow sorting on fields that exist on a nested structure within the connection's domain model, then we follow the previous approach recursively for all such fields.

Naming conventions for schema fields related to the `where` and `sortedBy` connection arguments can be understood by taking a look at the following schema implementations below

<br />

### Filtering and sorting on non root Query field connections

Let's say we want to provide the capability of filtering the posts of a user by the body and the capability of sorting the posts of a user by the username of the creator of the post. Here's how the graphQL schema for implementing this filter would look like

```graphql
enum SortedByOrder {
  ASCENDING
  DESCENDING
}

input PostCreatorSortedByInput @oneOf {
  id: SortedByOrder
}

input UserPostsSortedByInput @oneOf {
  body: SortedByOrder
  creator: PostCreatorSortedByInput
}

input PostBodyWhereInput {
  and: [PostBodyWhereInput!]
  equal: String
  greaterThan: String
  greaterThanEqual: String
  in: [String!]
  lessThan: String
  lessThanEqual: String
  notEqual: String
  notIn: [String!]
  notStartsWith: String
  or: [PostBodyWhereInput!]
  startsWith: String
}

input UserIdWhereInput {
  and: [UserWhereIdInput!]
  equal: String
  greaterThan: String
  greaterThanEqual: String
  in: [String!]
  lessThan: String
  lessThanEqual: String
  notEqual: String
  notIn: [String!]
  notStartsWith: String
  or: [UserWhereIdInput!]
  startsWith: String
}

input PostCreatorWhereInput {
  id: UserIdWhereInput
}

type UserPostsWhereInput {
  body: PostBodyWhereInput
  creator: PostCreatorWhereInput
}

type User {
  posts(
    after: String
    before: String
    first: Int
    last: Int
    sortedBy: [UserPostsSortedByInput!]
    where: UserPostsWhereInput
  ): PostsConnection
}
```

We expose the argument `where` which is a graphQL input `UserPostsWhereInput` containing two fields named `body` which is a graphQL input `PostWhereBodyInput` containing all the possible filters that can be applied on the body of a post and `creator` which is a graphQL input `PostCreatorWhereInput` for applying recursive filtering on the nested structure `creator` of a `post`. It contains one field named `id` which is a graphQL input `CreatorIdWhereInput` containing all the possible filters that can be applied on the id of a user.

We expose the argument `sortedBy` which is a graphQL input `UserPostsSortedByInput` containing two fields named `body` which is a graphQL enum `SortedByOrder` and `creator` which is a graphQL input `PostCreatorSortedByInput` for applying recursive sorting on the nested structure `creator` of a `post`. It contains one field named `id` which is a graphQL enum `SortedByOrder`. The graphQL enum `SortedByOrder` contains two variants `ASCENDING` and `DESCENDING` which are the only two possible values to sort any field by.

<br />

### Filtering and sorting on root Query field connections

Like we previously said, connections on the root `Query` field without any filters are mostly useless by themselves. When a connection like `PostsConnection` exists on a domain model like `User` the filter `post.creator.id` is already applied on it by the virtue of hierarchical relationships in graphQL. This isn't the case for root **Query** field connection resolvers. Here we'll have to provide explicit filters to the connection to allow the clients to query for posts in a meaningful way.

The schema implementation below is similar to the previous one except the connection now exists as a field on root **Query** field

```graphql
enum SortedByOrder {
  ASCENDING
  DESCENDING
}

input PostCreatorSortedByInput @oneOf {
  id: SortedByOrder
}

input QueryPostsSortedByInput @oneOf {
  body: SortedByOrder
  creator: PostCreatorSortedByInput
}

input PostBodyWhereInput {
  and: [PostBodyWhereInput!]
  equal: String
  greaterThan: String
  greaterThanEqual: String
  in: [String!]
  lessThan: String
  lessThanEqual: String
  notEqual: String
  notIn: [String!]
  notStartsWith: String
  or: [PostBodyWhereInput!]
  startsWith: String
}

input UserIdWhereInput {
  and: [UserIdWhereInput!]
  equal: String
  greaterThan: String
  greaterThanEqual: String
  in: [String!]
  lessThan: String
  lessThanEqual: String
  notEqual: String
  notIn: [String!]
  notStartsWith: String
  or: [UserIdWhereInput!]
  startsWith: String
}

input PostCreatorWhereInput {
  id: UserIdWhereInput
}

type QueryPostsWhereInput {
  body: PostWhereBodyInput
  creator: PostCreatorWhereInput
}

type Query {
  posts(
    after: String
    before: String
    first: Int
    last: Int
    sortedBy: [QueryPostsSortedByInput!]
    where: QueryPostsWhereInput
  ): PostsConnection
}
```

Notice the change in names of graphql inputs `QueryPostsSortedByInput` and `QueryPostsWhereInput` corresponding to posts connection arguments `sortedBy` and `where`. Everything else is similar to the schema implementation for non root **Query** posts connection.

Please don't refrain from using verbose naming in the schema. Try as much as possible to convey the intention using proper data structures and naming while also making sure there are no chances for naming collisions in the future.

These connection arguments convey a sane flow of operations to the developer while also sounding like a natural coherent sentence. Take a read

_**posts field connection on User type(non root Query connection field)**_

query for **first** `10` user posts

query for **first** `10` user posts **after** cursor `1`

query for **first** `10` user posts **after** cursor `1` **sorted by field body** in `ascending` **order**

query for **first** `10` user posts **after** cursor `1` **where** field **body** **contains** the string `somebody`

query for **first** `10` user posts **after** cursor `1` **sorted by field body** in `ascending` **order where** the field **body** **contains** the string `somebody`

_**posts field connection on Query type(root Query connection field)**_\*\*\_

query for **first** `10` posts

query for **first** `10` posts **after** cursor `1`

query for **first** `10` posts **after** cursor `1` **sorted by** field **body** in `ascending` **order**

query for **first** `10` posts **after** cursor `1` **where** field **body** **contains** the string `somebody`

query for **first** `10` query posts **after** cursor `1` **sorted by** field **body** in `ascending` **order where** the field **body** **contains** the string `somebody`

<br />

## Caution on filtering and sorting graphQL connections

Filtering and sorting are fairly expensive operations and should be used very sparingly. Filtering in particular can become a very expensive operation. The more filters a database needs to check and apply the longer the time it would take to resolve that database query. These operations usually require indexing the database fields that we want to filter or sort upon. Indexing in databases comes at the cost of slower mutations to the database records and also increases the size of the database considerably.

Filtering and sorting can become very complicated very quickly both in the application and the database. Developers and contributors to talawa should be judicious and only provide these capabilities when they deem it necessary for the client applications that require it. Refrain from providing these capabilities on the connections unless explicitly requested. Even when trying to provide it, implement only the capabilities required at the moment, do not try to over-architecture it by accepting all possible filtering and sorting arguments in the connections.

Most of the time, filtering and sorting capabilities are only required in dashboards and administrator panels. Role-based access control can be applied to these filtering and sorting capabilities to only allow the users with elevated permissions to utilize these capabilities. This could be enforced either within the graphQL schema or within the resolver implementation for the connection. The graphQL schema would be the more preferred option as it is the source of truth for both the clients and the server.

<br />

## When are graphQL connections not needed?

GraphQL connections might not be needed when the amount of records that the connection needs to traverse is very small. For example, think of a list of solar system planet names that are a user's favorite. There are only 8 planets in the solar system, a connection based on this relationship would only ever be used to traverse names of 8 planets. This surely isn't a place for a connection where we need to decisively traverse the records to reduce strain on the database and server. A simple `[String]` or `enum` type list can be returned. Here's an example

```graphql
enum SOLAR_SYSTEM_PLANETS {
  mercury
  venus
  earth
  jupiter
  saturn
  uranus
  neptune
}

type User {
  favouritePlanets: [String]
  favouritePlanets2: [SOLAR_SYSTEM_PLANETS]
  ...other fields
}
```

<hr />

**Check out this PR for reference:** [GraphQL Connection Utilities](https://github.com/PalisadoesFoundation/talawa-api/pull/1883)
