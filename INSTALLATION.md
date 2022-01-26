# Installation

Talawa API is a `node.js` application. It can be setup to run via `Docker` or node's default package manager `npm`.

## Docker

Follow these steps to get the api running using Docker.

**Note:** Docker downloads a lot of large images, if you are short on storage or with slow internet connection prefer using standard development installation.

1. Install <strong>Docker</strong> if you have not installed it.
1. Clone this repo to your local machine

        git clone https://github.com/PalisadoesFoundation/talawa-api
        cd talawa-api
        npm install

1. Talawa-API uses a configuration file named `.env` in the root directory. It is not a part of the repo and you will need to create it. There is a sample configuration file named `.env.sample` in the root diretory. Create a new `.env` file by copying the contents of the `.env.sample` file.

       cp .env .env.sample

1. Generate an `ACCESS_TOKEN_SECRET` using the `openessl` command below and copy the result to the `ACCESS_TOKEN_SECRET` section of the `.env` file.

        openssl rand -hex 32

1. Generate an `REFRESH_TOKEN_SECRET` using the `openessl` command below and copy the result to the `REFRESH_TOKEN_SECRET` section of the `.env` file.

        openssl rand -hex 32

1. Add the MongoDB URL that `talawa-api` will need to use to get access to the database to the `.env`. file.

        mongodb://mongo:27017/talawa-api

1. When finished, your `.env` file should have the following fields filled in.

    - ACCESS_TOKEN_SECRET
    - REFRESH_TOKEN_SECRET
    - MONGO_DB_URL

    Please review the contents of the `.env.sample` file for additional details.

1. Build the `docker` image that will support `talawa-api`

        sudo docker-compose build

1. Start the `docker` container. This is the command you will use to start the server after reboots.

        sudo docker-compose up

## Standard Installation

Follow these steps to get the API running.

1. Install these **mandatory** dependencies if you don't already have them:
    1. [Nodejs](https://nodejs.org/en/)<br>
1. Install these **optional** dependencies if you don't already have them:
    1. Talawa-API requires a MongoDB database. This can be provided either as a hosted MongoDB cloud service or installed locally on your machine.
        1. If you are going to install the database on a system you control, then follow these [MongoDB installation instructions](https://docs.mongodb.com/manual/administration/install-community/) 
        1. If you are using a cloud service such as mongodb.com then you do not have to install the optional MongoDB software.
        1. **Note:** If you are running MongoDB on a remote system, cloud or a system under your control, then ensure you have provided the correct access permissions and firewall openings for the VM/server/service where the MongoDB is hosted.
1. Clone this repo to your local machine

        git clone https://github.com/PalisadoesFoundation/talawa-api
        cd talawa-api
        npm install

1. Talawa-API uses a configuration file named `.env` in the root directory. It is not a part of the repo and you will need to create it. There is a sample configuration file named `.env.sample` in the root diretory. Create a new `.env` file by copying the contents of the `.env.sample` file.

       cp .env .env.sample

1. Generate an `ACCESS_TOKEN_SECRET` using the `openessl` command below and copy the result to the `ACCESS_TOKEN_SECRET` section of the `.env` file.

        openssl rand -hex 32

1. Generate an `REFRESH_TOKEN_SECRET` using the `openessl` command below and copy the result to the `REFRESH_TOKEN_SECRET` section of the `.env` file.

        openssl rand -hex 32

1. Add the MongoDB URL that `talawa-api` will need to use to get access to the database to the `.env`. file.
    1. If MongoDB is running on your local system for data storage then the generic format of the URL would be:

        mongodb://localhost:27017/`<DB_NAME>`?retryWrites=true&w=majority

        1. Where `<DB_NAME>` is the name of the MongoDB database

    1. If you are using a MongoDB cloud service for data storage, then the generic format of the URL would be:

        mongodb+srv://`<USERNAME>:<PASSWORD>@<SERVER_URL>/<DB_NAME>`?retryWrites=true&w=majority

        1. Where:
            1. `<USERNAME>` is your cloud service user name.
            1. `<PASSWORD>` is your cloud service password.
            1. `<SERVER_URL>` is your cloud service server URL.
            1. `<DB_NAME>` is your cloud service database name.
        1. Your cloud service may call this URL a `connect` string. Search for the word `connect` in your online database dashboard to find it.

1. When finished, your `.env` file should have the following fields filled in.

    - ACCESS_TOKEN_SECRET
    - REFRESH_TOKEN_SECRET
    - MONGO_DB_URL

    Please review the contents of the `.env.sample` file for additional details.

1. Install required node packages.

        npm install
 
1. Start the `talawa-api` server.
    1. This is the command you will use to start the server after reboots.

        npm run start

# Testing

You can run `talawa-api` tests using this command

        npm run test

