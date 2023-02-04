# Talawa-api installation

This document provides instructions on how to set up and start a running instance of talawa-api on your local system. The instructions are written to be followed in sequence so make sure to go through each of them step by step without skipping any sections.

<br/>

# Table of contents

- [Talawa-api installation](#talawa-api-installation)
- [Table of contents](#table-of-contents)
  - [Install node.js](#install-nodejs)
  - [Install git](#install-git)
  - [Clone this repository](#clone-this-repository)
  - [Change directory into the cloned repo](#change-directory-into-the-cloned-repo)
  - [Creating .env file](#creating-env-file)
  - [Access/refresh token secrets](#accessrefresh-token-secrets)
    - [Setting up ACCESS\_TOKEN\_SECRET in .env file](#setting-up-access_token_secret-in-env-file)
    - [Setting up REFRESH\_TOKEN\_SECRET in .env file](#setting-up-refresh_token_secret-in-env-file)
  - [MongoDB](#mongodb)
    - [Setting up the mongoDB database](#setting-up-the-mongodb-database)
    - [Setting up MONGODB\_URL in .env file](#setting-up-mongodb_url-in-env-file)
    - [Optional:- Managing mongodb database using VSCode extension](#optional--managing-mongodb-database-using-vscode-extension)
  - [Google/firebase](#googlefirebase)
    - [Setting up RECAPTCHA\_SECRET\_KEY in .env file](#setting-up-recaptcha_secret_key-in-env-file)
    - [Setting up MAIL\_USERNAME/MAIL\_PASSWORD in .env file](#setting-up-mail_usernamemail_password-in-env-file)
    - [Generate Firebase Keys for the Talawa Notification Service](#generate-firebase-keys-for-the-talawa-notification-service)
    - [Apply the Firebase Keys to the Talawa Mobile App](#apply-the-firebase-keys-to-the-talawa-mobile-app)
  - [Installing required packages](#installing-required-packages)
  - [Running talawa-api](#running-talawa-api)
  - [Accessing talawa-api](#accessing-talawa-api)
  - [Changing default talawa-api port](#changing-default-talawa-api-port)
  - [Running tests](#running-tests)
  - [Linting code files](#linting-code-files)

<br/>

## Install node.js

Best way to install and manage `node.js` is making use of node version managers. Two most popular node version managers right now are [fnm](https://github.com/Schniz/fnm) and [nvm](https://github.com/nvm-sh/nvm). We'd recommend `fnm` because it's written in `rust` and is much faster than `nvm`. Install whichever one you want and follow their guide to set up `node.js` on your system.

<br/>

## Install git

Follow the setup guide for `git` on official [git docs](https://git-scm.com/downloads). Basic `git` knowledge is required for open source contribution so make sure you're comfortable with it. [Here's](https://youtu.be/apGV9Kg7ics) a good tutorial to get started with `git` and `github`.

<br/>

## Clone this repository

First you need a local copy of talawa-api. Run the following command in the directory of choice on your local system.

        git clone https://github.com/PalisadoesFoundation/talawa-api

This will download a local copy of talawa-api in that directory.

<br/>

## Change directory into the cloned repo

Right after cloning the repo you can change the directory of your current `terminal(shell)` to the root directory of cloned repository using this command:-

        cd ./talawa-api

**NOTE:-** `All the commands we're going to execute in the following instructions will assume you are in the root directory of the project. If you fail to do so, the commands will not work.`

<br/>

## Creating .env file

A file named `.env` is required in the root directory of talawa-api for storing environment variables used at runtime. It is not a part of the repo and you will have to create it. For a sample of `.env` file there is a file named `.env.sample` in the root directory. Create a new `.env` file by copying the contents of the `.env.sample` into `.env` file.

        cp .env.sample .env

This `.env` file must be populated with the following environment variables for talawa-api to work:-

| Variable             | Description                                            |
| -------------------- | ------------------------------------------------------ |
| ACCESS_TOKEN_SECRET  | Used for signing/verifying JWT tokens                  |
| REFRESH_TOKEN_SECRET | Used for signing/verifying JWT tokens                  |
| MONGO_DB_URL         | Used for connecting talawa-api to the mongoDB database |
| RECAPTCHA_SECRET_KEY | Used for authentication using reCAPTCHA                |
| MAIL_USERNAME        | Used for mailing service                               |
| MAIL_PASSWORD        | Used for mailing service                               |

Follow the instructions from [Access/refresh token secrets](#accessrefresh-token-secrets) section up to and including [Google/firebase](#googlefirebase) section to learn more about these environment variables and how to set them up.

<br/>

## Access/refresh token secrets

Access and refresh token secrets are used for authentication purposes.

<br/>

### Setting up ACCESS_TOKEN_SECRET in .env file

Run the following command and copy/paste the result to the variable named `ACCESS_TOKEN_SECRET` in `.env` file.

        openssl rand -hex 32

<br/>

### Setting up REFRESH_TOKEN_SECRET in .env file

Run the following command and copy/paste the result to the variable named `REFRESH_TOKEN_SECRET` in `.env` file.

        openssl rand -hex 32

<br/>

## MongoDB

Talawa-api makes use of `mongoDB` for its database needs. We make use of `mongoose ODM` to interact with the mongoDB database from within the code.

**NOTE -**
It must be noted that that talawa-api actually uses **2** databases. You only have to setup
one database and provide it's URL in the .env file. This will be `primary database` and would
be used to store all your data.

In addition, we would automatically create a new database with the name `TALAWA_TESTING_DB`,
which would be exclusively used for storing all the test data generated during the testing process so that it does not bloat the main database with unnecessary data.

<br/>

### Setting up the mongoDB database

We're listing some common approaches to set up a running instance of mongodb database:-

1. `Hosted database approach:-` MongoDB Atlas is the easiest way to get a running instance of mongodb database. It is a hosted(remote) mongodb database provided by mongodb itself. If you're a beginner and don't want too much of a hassle setting up the database you should use this approach. Follow the setup guide on official [mongodb atlas docs](https://www.mongodb.com/docs/atlas/getting-started/). Mongodb Atlas is just one of the many hosted database solutions. If you want to use something else please do your own research.

2. `System native database approach:-` You can install mongodb natively on your system and create/connect to the database. Follow the setup guide on official [mongodb docs](https://www.mongodb.com/docs/manual/administration/install-community/) for your respective operating system.

3. `Docker container approach:-` If you are fluent in working with docker you should use this approach. Docker is a great way to manage and run applications without natively installing anything on your system. With this you can set up the mongodb database inside a docker container and manage it as per your will. Follow this [video tutorial](https://www.youtube.com/watch?v=uklyCSKQ1Po) to set up a mongodb docker container.

<br/>

### Setting up MONGODB_URL in .env file

Which approach you choose to set up your mongodb database does not matter. What matters is the `connection string` to that database using which talawa-api can connect to it. `Connection string` can differ depending on the approach you used to set up your database instance. Please read the official [mongodb docs](https://www.mongodb.com/docs/manual/reference/connection-string/) on `connection string`. Copy/paste this `connection string` to the variable named `MONGO_DB_URL` in `.env` file.

Your MongoDB installation may include either the `mongo` or `mongosh` command line utility. An easy way of determining the `connection string` is to:

1. Run the command line utility
1. Note the `connection string` in the first lines of the output.
1. Add the first section of the `connection string` to the `MONGO_DB_URL` section of the `.env` file. In this case it is `mongodb://127.0.0.1:27017/`

```
$ mongosh

Current Mongosh Log ID: e6ab4232a963d456920b3736
Connecting to:          mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+1.6.2
Using MongoDB:          6.0.4
Using Mongosh:          1.6.2

For mongosh info see: https://docs.mongodb.com/mongodb-shell/

...
...
...
...

```

<br/>

### Optional:- Managing mongodb database using VSCode extension

This guide is for `VSCode` users to easily manage their `mongoDB` databases:-

1.  Install the offical `MongoDB` extension for `VSCode` named `MongoDB for VS Code`.

    ![Install official mongoDB vscode extension](./image/install_mongodb_vscode_extension.webp)

<br/>

2. Connect your `mongoDB` database to the extension.

   ![Connect your mongoDB database to the extension](./image/connect_extension_to_mongodb_step_1.webp)

    <br/>

   ![Connect your mongoDB database to the extension](./image/connect_extension_to_mongodb_step_2.webp)

3. Now you can manage the database you are using for `talawa-api` through this extension within `VSCode`.

<br/>

## Google/firebase

You need to have a `google` account to follow the following steps.

<br/>

### Setting up RECAPTCHA_SECRET_KEY in .env file

<br/>

We use `reCAPTCHA` for authentication. Follow these steps:-

1. Visit [this](https://www.google.com/recaptcha/admin/create) url.
2. Fill in the input blocks as shown in the screenshot:-

   ![Set up recaptcha page](./image/recaptcha_set_up.webp)

3. Click on `Submit` button.
4. Copy the generated `Secret Key` to variable named `RECAPTCHA_SECRET_KEY` in `.env` file.

   ![Set up recaptcha page](./image/recaptcha_site_and_secret_key.webp)

5. Save the generated `Site key` as it will be used in `talawa-admin`.

<br/>

### Setting up MAIL_USERNAME/MAIL_PASSWORD in .env file

**NOTE:-** `Your google account needs to have two factor authentication set up for the following steps to work.`

1.  Go to your [google account page](https://myaccount.google.com/).

2.  Select `Security`.

3.  Under `Signing in to Google` section select `App Passwords`.

4.  Click on `Select app` section and choose `Other(Custom name)`, enter `talawa` as the custom name and press `Generate` button.

5.  Copy the 16 character generated app password to the variable named `MAIL_PASSWORD` in `.env` file.

6.  Copy you usual gmail address to the variable named `MAIL_USERNAME` in `.env` file.

For more info refer to [this](https://support.google.com/accounts/answer/185833).

<br/>

### Generate Firebase Keys for the Talawa Notification Service

We use firebase for mobile app notifications. To configure the notification service create a new firebase project and follow these steps:-

1. Create a new Firebase project for Talawa-API

1. When created you will automatically enter the project's console area

1. Click on the settings icon beside the `Project Overview` heading

1. Click on `Project Settings`

1. Click on the `Service Accounts` tab

1. Click on the `Node.js` radio button

1. Click on `Generate New Private Key` button

1. Confirm by clicking on `Generate Key`. This will automatically download the private keys in your browser.

1. Securely store the `JSON` file containing the private key. These will be used in the next section.

### Apply the Firebase Keys to the Talawa Mobile App

The key generated in the previous step is in a format suitable for use in a mobile app. We need to convert it for use by the API. This will require you to do some work in the talawa repository to do the necessary conversion. The resulting output will be stored in a `lib/firebase_options.dart` file. Some of the contents of this file will then need to be added to the API's `.env` file. Here we go.

1.  Clone the talawa mobile app in a separate directory that is not under your Talawa-API directory.

1.  Enter that directory as you will need to edit files there

1.  Run the following commands to set the key in the environment variable for your respective operating system:

    1.  `Linux/macOS:`

            export GOOGLE_APPLICATION_CREDENTIALS="/PATH/TO/JSON/FILE/filename.json"

    1.  `Windows:`

            $env:GOOGLE_APPLICATION_CREDENTIALS="C:\PATH\TO\JSON\FILE\filename.json"

1.  Install the [Firebase CLI](https://firebase.google.com/docs/cli#install_the_firebase_cli).

1.  Save the origintal copy the `lib/firebase_options.dart` file as it will be modified.

1.  Run the following commands in the project directory of talawa mobile app:

        firebase login

        dart pub global activate flutterfire_cli

1.  Run any commands about exporting variables from the previous `dart` command.

1.  Run the following command to configure the application for Firebase

    flutterfire configure

1.  Select the project you created in the firebase console.

1.  Add `iOS` and `android` platforms to the project.

1.  Overwrite the `firebase_options.dart` file if asked so.

1.  The command will generate keys for the `iOS` and `android` platforms respectively and place them in the `firebase_options.dart` file.

1.  Edit the `firebase_options.dart` file.

1.  Add the parameters in the `static const FirebaseOptions android = FirebaseOptions` section of the `firebase_options.dart` file to the Talawa API `.env` file under the `androidFirebaseOptions` heading.

    1.  Replace any parameters that are already there in that section.
    1.  Remove any trailing commas on the lines you have added.
    1.  Remove any leading spaces on the lines you have added.
    1.  The final result in the `.env` file should look like this

                 apiKey: '9f6297b283db701dab7766c993c48b',
                 appId: '1:261699118608:android:366ff7dbdfba5c5a9e8392',
                 messagingSenderId: '261699118608',
                 projectId: 'talawa-thingy',
                 storageBucket: 'talawa-thingy.appspot.com',

1.  Add the parameters in the `static const FirebaseOptions ios = FirebaseOptions` section of the `firebase_options.dart` file to the Talawa API `.env` file under the `iosFirebaseOptions` heading. Replace any paramters that are already there.

    1.  Replace any parameters that are already there in that section.
    1.  Remove any trailing commas on the lines you have added.
    1.  Remove any leading spaces on the lines you have added.
    1.  The final result in the `.env` file should look like this

                 apiKey: 'c2d283aa45f4e858c9cbfe32c58c67',
                 appId: '1:261699118608:ios:1babbb3c07b8461ebdcb2',
                 messagingSenderId: '261699118608',
                 projectId: 'talawa-thingy',
                 storageBucket: 'talawa-thingy.appspot.com',
                 iosClientId: '261699118608-d519b739e43c6214374c0da62feaef.apps.googleusercontent.com',
                 iosBundleId: 'com.example.talawa',

1.  Undo the changes made to the `firebase_options.dart` file by overwriting it with the version you saved at the beginning of this section.

<br/>

## Installing required packages

Install the packages required by `talawa-api` using this command:

       npm install

<br/>

## Running talawa-api

Talawa-api development server runs two processes simultaneously in the background. They are:-

1. `GraphQL code generator:-` This watches for changes in the graphQL type definition files and generates corresponding typescript types in the background. This results in good code editor experience with typescript.

2. `Talawa-api server:-` This runs talawa-api directly transpiling the typescript files and running them without emitting as javascript files. It also watches for changes in the code files and restarts the server if it detects any changes.

Run the following command to start talawa-api development server:-

        npm run dev

<br/>

## Accessing talawa-api

By default talawa-api runs on `port 4000` on your system's localhost. It is available on the following endpoint:-

        http://localhost:4000/

If you navigate to the endpoint you and see a `JSON` response like this it means talawa-api is running successfully:-

        {"talawa-version":"v1","status":"healthy"}

GraphQL endpoint for handling `queries` and `mutations` is this:-

        http://localhost:4000/graphql/

GraphQL endpoint for handling `subscriptions` is this:-

        ws://localhost:4000/graphql/

<br/>

## Changing default talawa-api port

If port `4000` is not free on your system you can pass a custom environment variable named `PORT` to the script to make it use a different port on your system's localhost. Here's the syntax for it:-

        PORT=<CUSTOM_PORT_VALUE> npm run dev

where `<CUSTOM_PORT_VALUE>` is whatever value you want the `PORT` to be. Whatever you pass will be substituted as the value for port and talawa-api development server on that port. Syntax wise it looks like-

        http://localhost:<CUSTOM_PORT_VALUE>/

For example:-

        PORT=5000 npm run dev

will make talawa-api accessible on the following endpoint:-

        http://localhost:5000/

<br/>

## Running tests

Talawa-api makes use of `vitest` to run tests because it is much faster than `jest` and more comfortable to work with.

You can run the tests for talawa-api using this command:-

        npm run test

<br/>

**NOTE -** STRICTLY use the `test` script to run the tests as this script sets the `NODE_ENV` to `testing` and thus connects to the testing database instead of the main database.

Using other ways to run tests (like using `npx vitest`) may result in the bloating of the main database with testing data. Before using such methods, do ensure the `NODE_ENV` is set to `testing` to avoid the aforementioned.

## Linting code files

You can lint your code files using this command:-

        npm run lint
