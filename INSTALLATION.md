# Talawa-API Installation

Talawa API is mainly written and built using `node.js` and `typescript`. We are providing some common approaches to set it up on your system.

# Preparation

These steps will help you install API files.

## Clone the Repository

You will need to download the API files to your system. Here's how.

1.  Clone this repo to your local machine:    

    ```
    git clone https://github.com/PalisadoesFoundation/talawa-api
    ```

1.  Change directory to cloned folder:

    ````
    cd talawa-api
    ````

## Copy the `.env` Configuration File

Talawa-API uses a configuration file named `.env` in the root directory. It is not a part of the repo and you will need to create it. There is a sample configuration file named `.env.sample` in the root directory. The `.env.sample` file includes comments for each parameter.


1. Create a new `.env` file by copying the contents of the `.env.sample` file.

    ```
    cp .env.sample .env
    ```

1. You will then need to populate the `.env` file with the following paramters. This document will guide you as to how to add the correct values to each.

| Variable             | Description |
| -------------------- | ----------- |
| ACCESS_TOKEN_SECRET  |             |
| REFRESH_TOKEN_SECRET |             |
| MONGO_DB_URL         |             |
| RECAPTCHA_SECRET_KEY |             |
| MAIL_USERNAME        |             |
| MAIL_PASSWORD        |             |


# Installation: Standard Method

This is the method that we recommend: 

## Prerequisites

It's best to follow these steps prior to starting installation. You will need:

1. A running mongodb database connection string. Refer to `Setting Up The MongoDB Database` section for more information.
1. NodeJS installed on your local system (Version 14 or above preferrable). It's best to use a NodeJS version manager your system. Closely follow the setup guides for the one you choose. Here are some popular managers to choose from:
    1. [fnm](https://github.com/Schniz/fnm)
    1. [nvm](https://github.com/nvm-sh/nvm).

## Getting the API Running

Follow these steps to get the API running.

### Prerequisite Package Installation

These steps will help you install the prerequiste packages

1.  Clone this repo and create a `.env` file as mentioned at the top of the document. 
1.  Install the npm packages required by talawa-api.

    `npm install`

### Setting Up The MongoDB Database

A running instance of mongodb and it's connection string is required for making use of talawa-api.

#### MongoDB Hosting Options

Here is a list of some common approaches to get a running instance of mongodb database.

1. **Using a hosted(remote) mongodb database:**
    1. MongoDB Atlas is the easiest way to get a running instance of mongodb database. We will be making use of mongodb atlas though mongodb can be hosted using other platforms as well. Follow the setup guide on [mongodb atlas docs](https://www.mongodb.com/docs/atlas/getting-started/). If you want to use some other mongodb hosted database please do your own research.
1. **Using a mongodb database installed on your local system natively:**
    1. Follow the setup guide on [mongodb docs](https://www.mongodb.com/docs/manual/administration/install-community/) for your respective operating system.
1. **Using a containerized mongodb docker container on your local system:**
    1. Follow the setup guide using this [video tutorial](https://www.youtube.com/watch?v=uklyCSKQ1Po).

**Note:** If you are running mongodb on a remote system, either a cloud service or a system under your control, then ensure you have provided the correct access permissions and firewall openings for the VM/server/service where the mongodb is hosted.

#### The MongoDB Connection String URL

After selecting your hosting method, you will need to:

1. Save the MongoDB connection string to be used in the `Talawa-API` `.env` configuration file.
1. Assign the connection string URL to the environment variable named `MONGO_DB_URL` inside the `.env` file. 

### Configuring Access Tokens

Tokens are required for the mobile app to communicate with the API

1.  Generate an `ACCESS_TOKEN_SECRET` using the `openessl` command below and copy the result to the `ACCESS_TOKEN_SECRET` section of the `.env` file.

    `openssl rand -hex 32`

1.  Generate an `REFRESH_TOKEN_SECRET` using the `openessl` command below and copy the result to the `REFRESH_TOKEN_SECRET` section of the `.env` file.

    `openssl rand -hex 32`

### Configuring reCAPTCHA

We also use reCAPTCHA for authentication.

1.  Create a Google reCAPTCHA v2 secret key from `google-recaptcha-admin`
    1. Visit the https://www.google.com/recaptcha/admin/create URL 
    1. Navigate the "I'm not a robot" Checkbox
    1. Use `localhost` for the domain.
1. Copy the key to the `RECAPTCHA_SECRET_KEY` section of the `.env` file.

### Configuring Mail

You will now need to update the `.env` file with Gmail credentials for sending mails to the users. You don't need to use your own login information. There is a way to create a unique `username` and `password` for use in applications. These will be used for the `MAIL_USERNAME` and `MAIL_PASSWORD` respectively in the `.env` file. Follow this link for more information on this process https://support.google.com/accounts/answer/185833. 

Follow these steps:

1. Go to your Google Account, https://myaccount.google.com/
1. Select Security.
1. Under "Signing in to Google," select App Passwords.
1. At the bottom, choose Select app and choose the app you're using and then Select device and choose the device you’re using and then Generate.
1. The App Password is the 16-character code in the yellow bar on your device.
1. Paste that App Password in `MAIL_PASSWORD`.
1. **Note**: You must setup two factor authentication in order to allow the app password.

### Configuring Firebase

We use Firebase for mobile app notifications. To configure the notification service create a new firebase project:

1. In the Firebase console, open Settings > [Service Accounts](https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk).
1. Click Generate New Private Key, then confirm by clicking Generate Key.
1. Securely store the JSON file containing the key.
1. Run the following command to set the key in the environment variable:
    1. **Linux/macOS:**
        1. export GOOGLE_APPLICATION_CREDENTIALS="/home/user/Downloads/service-account-file.json"
    1. **Windows:**
        1. $env:GOOGLE_APPLICATION_CREDENTIALS="C:\Users\username\Downloads\service-account-file.json"
1.  Install the [Firebase CLI](https://firebase.google.com/docs/cli#install_the_firebase_cli).
1.  Copy the `firebase_options.dart` file as it will be modified.
1.  Run the following commands in the project directory of talawa mobile app:

    `firebase login`

    `dart pub global activate flutterfire_cli`

    `flutterfire configure`

1.  Select the project you created in the Firebase console in step 2.
1.  Add iOS and android platforms to the project.
1.  Overwrite the `firebase_options.dart` file if asked so.
1.  Copy the keys to `.env` file, for how to set keys refer to `.env.sample` file.
1.  Undo the changes made to the `firebase_options.dart` file by pasting the old content from step 2.

### Start the API

Now it's time to get the API started.

1. The command below will run the talawa-api server in development environment.

    `npm run dev`

1. Configure Talawa and Talawa-Admin to use this URL

    `http://localhost:xxx`

1. To stop the server use this keybind in the terminal where the above command is executed :

    `CTRL + C`

# Installation: Using Docker

Follow these steps to get Talawa-API working with Docker

## Prerequisites

Follow these steps first:

1. Clone this repo and create a `.env` file as mentioned at the top of the document. 
1. Make sure the `Docker` application is installed on your system. Follow the setup guide on [docker docs](https://docs.docker.com/get-docker/).
2. Verify that Free port `27017` on your system's localhost.

**Note:** We are not listing every possible thing you need to know about docker in the following steps. We expect you to have minimum working knowledge with docker if you're using this approach. If you don't know anything about Docker it's better to either learn about docker first or go with the steps mentioned in the section `Installation using standard method`. Also docker downloads a lot of large images, if you are short on storage or with slow internet connection prefer using the standard method.

## Getting the API Running

Follow these steps to get the API running.

### Configure MongoDB

We have written the docker configuration in such a way that both `Talawa-API` and MongoDB are started inside a docker container. 

1. Both of them communicate with each other internally. This is done so you don't have to manually set up a mongodb database and then connect it to the `Talawa-API` Docker container yourselves. Within the Docker environment this MongoDB container is accessible using this connection string :

        mongodb://talawa_mongodb:27017/<DATABASE_NAME>?retryWrites=true&w=majority

1. We have mapped this mongodb docker container to port `27017` of your system's `localhost`. Make sure that port `27017` is free on your system's localhost or you'll get an error. Use this alternative connection string to access this mongodb container on your system **external to Docker**:

        mongodb://localhost:27017/<DATABASE_NAME>?retryWrites=true&w=majority

1. You will need to assign the connection string URL to the environment variable named `MONGO_DB_URL` inside the `.env` file. 

### Other Configuration Parameters

1. Use the steps outlined in the `Installation: Standard Method` section to configure the remaining `.env` file parameters.

### Managing the Docker Instance

Follow these steps to manage the Docker instance.

1.  Build the `docker` image that will support talawa-api

    `sudo docker-compose build`

1.  To start the `talawa-api` docker container run this command while being in the talawa-api folder directory :-

    `sudo docker-compose up`

1. Ensure that `Docker` automatically starts on the next reboot your system. Follow the steps in this [start docker on boot guide](https://docs.docker.com/engine/install/linux-postinstall/#configure-docker-to-start-on-boot).

1. To stop the `talawa-api` docker container run this command while being in the talawa-api folder directory :-

    `sudo docker-compose down`

# Automated Installation

This method will automate most of the work needed for setting up talawa-api.

Pre-requisites :-

1. A running mongodb database connection string.

2. NodeJS installed on your local system(version 14 or above preferrable). It's best to make use of a node version manager to manage nodejs versions on your system. Two popular node version managers currently are [fnm](https://github.com/Schniz/fnm) and [nvm](https://github.com/nvm-sh/nvm). Follow the setup guide for either of them and install NodeJS.

Follow these steps to get the api running :-

1.  Clone this repo to your local machine using this command :-

         git clone https://github.com/PalisadoesFoundation/talawa-api

2.  Change directory into the cloned folder using this command :-

        cd talawa-api

3.  Run the setup command :-

        npm run setup

# Testing

You can run the tests for talawa-api using this command :-

        npm run test
