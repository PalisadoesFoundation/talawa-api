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
http://127.0.0.1:4000/graphql
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
ws://127.0.0.1:4000/graphql
```

#### Accessing the API in Talawa App Using Remote Access

1. Launch the terminal application on your device.

2. **Retrieve IPv4 Address**:

   - **For Windows Users**: Enter the command `ipconfig`.
   - **For Linux/OSX Users**: Enter the command `ifconfig`.
   - Copy the `IPv4 Address` displayed (e.g., `192.168.12.233`).

3. Make sure both your mobile and your computer are connected to the same network.

4. Use the following format for your endpoint:

```
http://<IPv4 address>:4000/graphql
```

Replace `<IPv4 Address>` with the actual IP address you copied in step 2.

**Note**: In the Talawa app, type the endpoint URL in the field labeled `Enter Community URL`.

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

## Resetting Docker

**NOTE:** This applies only to Talawa API developers.

Sometimes you may want to start all over again from scratch. These steps will reset your development docker environment.

1. From the repository's root directory, use this command to shutdown the dev container.
   ```bash
   docker compose down
   ```
1. **WARNING:** These commands will stop **ALL** your Docker processes and delete their volumes. This applies not only to the Talawa API instances, but everything. Use with extreme caution.
   ```bash
   docker stop $(docker ps -q)
   docker rm $(docker ps -a -q)
   docker rmi $(docker images -q)
   docker volume prune -f
   ```
1. Restart the Docker dev containers to resume your development work.
   ```bash
   devcontainer build --workspace-folder .
   devcontainer up --workspace-folder .
   ```

Now you can resume your development work.

## Testing The API

Use the `API_BASE_URL` URL configured in the `.env` file. As the endpoint uses GraphQL, the complete URL will be `API_BASE_URL/graphql`

### Using Curl

This section shows how to do some basic transactions using CURL

#### Sign-in

This endpoint is used to sign in a user.

**Request:**

```bash

curl -X POST -H "Content-Type: application/json" -k <API_BASE_URL>/graphql -d '{
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

#### Organization Creation

This endpoint is used to create a new organization.

**Request:**

```bash
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer <your_token>" -k  <API_BASE_URL>/graphql -d '{
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

### Using GraphiQL

Here are some basic commands you can use for testing

#### Signing in as Administrator

Use the following GraphQL **query** to get an **authentication token** for authorization in later queries:

```graphql
mutation {
  signIn(
    input: { emailAddress: "administrator@email.com", password: "password" }
  ) {
    authenticationToken
    user {
      id
      name
    }
  }
}
```

#### Promote a Registered User to an Administrator

Use the following GraphQL **mutation** to assign **administrator** role to user:

```graphql
mutation {
  updateUser(input: { id: "user-id", role: administrator }) {
    id
    name
  }
}
```

#### Creating Organizations

Use the following GraphQL **mutation** to create an organization:

```graphql
mutation {
  createOrganization(
    input: {
      addressLine1: "Los Angeles"
      addressLine2: "USA"
      city: "Los Angeles"
      countryCode: in
      description: "testing"
      name: "Test Org 7"
      postalCode: "876876"
      state: "California"
    }
  ) {
    id
  }
}
```

#### Create an Organization Administrator

Use the following GraphQL **mutation** to assign **administrator** role to user:

```graphql
mutation {
  createOrganizationMembership(
    input: {
      memberId: "user-id"
      organizationId: "org-id"
      role: administrator
    }
  ) {
    id
    name
    addressLine1
    createdAt
    members(first: 5) {
      pageInfo {
        hasNextPage
        startCursor
      }
      edges {
        cursor
        node {
          id
          name
        }
      }
    }
  }
}
```
