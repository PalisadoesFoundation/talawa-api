---
id: testing
title: Testing & Validation
slug: /developer-resources/testing
sidebar_position: 4
---

This section covers important tests to validate the operation of the API.

## Accessing the API

These are some important URLs for coding and troubleshooting:

### Validation

1. By default talawa-api runs on port 4000. It is available on the following endpoint:

   ```
   http://127.0.0.1:4000
   ```

   - If you navigate to the endpoint you and see a JSON response like this.

   ```json
   {
     "message": "Route GET:/ not found",
     "error": "Not Found",
     "statusCode": 404
   }
   ```

### GraphQL

This section covers how to access the GraphQL API interface.

#### Interactive Web Queries With GraphiQL

The url for accessing the GraphQL Playground is

```bash
http://127.0.0.1:4000/graphiql
```

#### Programmatic Queries With GraphiQL

The graphQL endpoint for handling `queries` and `mutations` is this:

```
http://127.0.0.1:4000/graphql/
```

1. This is the Organization URL to be used for:
   1. The Talawa Mobile app
   1. The Talawa Admin app
1. If you navigate to the endpoint you and see a JSON response like this.

```json
{ "data": null, "errors": [{ "message": "Unknown query" }] }
```

#### Subscriptions with GraphQL

The GraphQL endpoint for handling `subscriptions` is:

```
ws://127.0.0.1:4000/graphql/
```

## Database Management

This section covers easy ways for developers to validate their work

### CloudBeaver

CloudBeaver is a lightweight web application designed for comprehensive data management. It allows you to work with various data sources, including SQL, NoSQL, and cloud databases, all through a single secure cloud solution accessible via a browser.

#### Accessing the PostgreSQL Database using CloudBeaver

1. Open your preferred browser and navigate to:
   ```bash
   http://127.0.0.1:8978/
   ```
2. Log in to the CloudBeaver UI using the following credentials (these credentials can be modified in the `.env.devcontainer` file by changing the `CLOUDBEAVER_ADMIN_NAME` and `CLOUDBEAVER_ADMIN_PASSWORD` variables):
   ```
   Username: talawa
   Password: password
   ```
3. You should now see the CloudBeaver UI. Click on the "New Connection" button and select `PostgreSQL` from the list of available connections.
4. Fill in the connection details as follows:
   ```
   Name: talawa
   Host: postgres
   Port: 5432
   Database: talawa
   Username: talawa
   Password: password
   ```
   - **Note:** The host name should match the one specified in the Docker Compose file and credentials should match those specified in the `.env.development` file.
5. Check the `Save credentials for all users with access` option to avoid entering the credentials each time.
6. Check the following boxes in the Database list:
   ```sql
   show all databases
   show template databases
   show unavailable databases
   show database statistics
   ```
7. Click `Create` to save the connection.
8. You should now see the `PostgreSql@postgres` connection in the list of available connections. Click on the connection to open the database.
9. Navigate to `PostgreSql@postgres > Databases > talawa > Schemas > public > Tables` to view the available schemas.

#### Accessing the PostgreSQL Test Database using CloudBeaver

1. Click on the `New Connection` button and select `PostgreSQL` from the list of available connections.
2. Fill in the connection details as follows:

   ```
   Name: talawa
   Host: postgrestest
   Port: 5432
   Database: talawa
   Username: talawa
   Password: password
   ```

   - **Note:** The host name should match the one specified in the Docker Compose file and credentials should match those specified in the `.env.development` file.

3. Check the `Save credentials for all users with access` option to avoid entering the credentials each time.
4. Check the following boxes in the Database list:
   ```sql
   show all databases
   show template databases
   show unavailable databases
   show database statistics
   ```
5. Click `Create` to save the connection.
6. You should now see the `PostgreSql@postgres-test` connection in the list of available connections. Click on the connection to open the database.
7. Navigate to `PostgreSql@postgres-test > Databases > talawa > Schemas > public > Tables` to view the available tables.

## Object Storage Management

MinIO is a free, open-source object storage server that's compatible with Amazon S3. It's designed for large-scale data storage and can run on-premises or in the cloud.

### Accessing MinIO - (Production Environments)

1. Open your preferred browser and navigate to:
   ```bash
   http://127.0.0.1:9001/
   ```
2. Log in to the MinIO UI using the following credentials(these credentials can be modified in the env files by changing the `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD` variables):
   - Username: `talawa`
   - Password: `password`
3. You should now see the MinIO UI. Click on the `Login` button to access the MinIO dashboard.
4. You can now view the available buckets and objects in the MinIO dashboard.

### Accessing MinIO - (Development Environments)

1. Open your preferred browser and navigate to:
   ```bash
   http://127.0.0.1:9003/
   ```
2. Log in to the MinIO UI using the following credentials(these credentials can be modified in the `.env.devcontainer` file by changing the `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD` variables):
   - Username: `talawa`
   - Password: `password`
3. You should now see the MinIO UI. Click on the `Login` button to access the MinIO dashboard.
4. You can now view the available buckets and objects in the MinIO dashboard.

## Testing The API

Use the `API_BASE_URL` URL configured in the `.env` file

### Sign-in

This endpoint is used to sign in a user.

**Request:**

```bash

curl -X POST -H "Content-Type: application/json" -k <API_BASE_URL> -d '{
  "query": "query signIn($input: QuerySignInInput!) { signIn(input: $input) { authenticationToken user { emailAddress id name } } }",
  "variables": {
    "input": {
      "emailAddress": "administrator@email.com",
      "password": "password"
    }
  }
}'

```

**Request Headers:**

- `Content-Type: application/json`

**Request Body:**

```json
{
  "query": "query signIn($input: QuerySignInInput!) { signIn(input: $input) { authenticationToken user { emailAddress id name } } }",
  "variables": {
    "input": {
      "emailAddress": "administrator@email.com",
      "password": "password"
    }
  }
}
```

**Response:**

- Returns the authentication token and user details (email address, id, and name).

### Organization Creation

This endpoint is used to create a new organization.

**Request:**

```bash
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer <your_token>" -k  <API_BASE_URL> -d '{
  "query": "mutation Mutation_createOrganization($input: MutationCreateOrganizationInput!) { createOrganization(input: $input) { id name } }",
  "variables": {
    "input": {
      "name": "name0"
    }
  }
}'
```

**Request Headers:**

- `Content-Type: application/json`
- `Authorization: Bearer <your_token>`

**Request Body:**

```json
{
  "query": "mutation Mutation_createOrganization($input: MutationCreateOrganizationInput!) { createOrganization(input: $input) { id name } }",
  "variables": {
    "input": {
      "name": "name0"
    }
  }
}
```

**Response:**

- Returns the newly created organization's ID and name.
