# Install/setup node.js

Best way to install and manage node.js is making use of node managers. Two most popular node managers right now are [fnm](https://github.com/Schniz/fnm) and [nvm](https://github.com/nvm-sh/nvm). We'd recommend fnm because it's much faster than nvm. Install whichever one you want and follow their guide to set up node.js on your system.

# Install git on your system

Follow the setup guide on official [git docs](https://git-scm.com/downloads). Basic git knowledge is required for open source contribution so make sure you're comfortable with it. [Here's](https://youtu.be/apGV9Kg7ics) a good tutorial to get started with git and github.

# Clone this repository

First you need a local copy of talawa-api. Run the following command in the directory of choice on your local system.

        git clone https://github.com/PalisadoesFoundation/talawa-api

This will download a local copy of talawa-api in that directory.

# Change directory into the cloned repo(important)

Right after cloning the repo you can change directory of your current terminal(shell) to the root directory of cloned repository. Use this command to do so:-

        cd ./talawa-api

**Note:-**` All the commands we're going to execute in the following instructions will assume you are in the root directory of the project. So make sure you are in the root directory of the talawa-api repository that you've cloned. If you fail to do so, the commands will not work.`

# Creating .env file

A file named `.env` is required in the root directory of talawa-api for storing environment variables required by talawa-api. It is not a part of the repo and you will need to create it. There is a sample file named `.env.sample` in the root directory. Create a new `.env` file by copying the contents of the `.env.sample` file.

        cp .env.sample .env

This .env file must be populated with the following environment variables for talawa-api to work:-

1. ACCESS_TOKEN_SECRET
2. REFRESH_TOKEN_SECRET
3. MONGODB_URL
4. RECAPTCHA_SECRET_KEY
5. MAIL_USERNAME
6. MAIL_PASSWORD

Following series of steps will guide you through setting these environment variables and additional stuff.

# Setting up access/refresh token secrets

Access and refresh token secrets are used for JWT authentication purposes. Follow these steps to set them up:-

1.  Run the following command and copy/paste the result to the variable named `ACCESS_TOKEN_SECRET` in the `.env` file.

        openssl rand -hex 32

2.  Run the following command and copy/paste the result to the variable named `REFRESH_TOKEN_SECRET` in the `.env` file.

        openssl rand -hex 32

# Setting up the mongoDB database

Talawa-api makes use of mongodb as its primary database. Therefore, we're listing some common approaches to set up a running instance of mongodb database:-

1. `First approach:-` MongoDB Atlas is the easiest way to get a running instance of mongodb database. It is a hosted(remote) mongodb database provided by mongodb itself. If you're a beginner and don't want too much of a hassle setting up the database you should use this approach. Follow the setup guide on official [mongodb atlas docs](https://www.mongodb.com/docs/atlas/getting-started/). Mongodb Atlas is just one of the many hosted database solutions. If you want to use something else please do your own research.

2. `Second approach:-` You can install mongodb natively on your system and create/connect to the database. Follow the setup guide on official [mongodb docs](https://www.mongodb.com/docs/manual/administration/install-community/) for your respective operating system.

3. `Third approach:-`If you don't want to bloat your system with unnecessary stuff docker is a great way to manage applications. You can set up a mongodb database inside a docker container and manage it as per your will. Follow the setup guide using this [video tutorial](https://www.youtube.com/watch?v=uklyCSKQ1Po).

Which approach you choose to set up your mongodb database does not matter. What matters is the connection string to that database using which talawa-api can connect to it. Connection string can differ depending on the approach you used to set up your database instance. Please read the official [mongodb docs](https://www.mongodb.com/docs/manual/reference/connection-string/) on connection string. Copy/paste this connection string to the variable named `MONGO_DB_URL` in the `.env` file.

# Setting up google and firebase

You need a google account and a firebase app instance to make use of mailing service. Follow these steps to set it up:-

1. Get the google recaptcha secret key from `google-recaptcha-admin` for reCAPTCHA v2 and "I'm not a robot" Checkbox, and copy the key to the variable named `RECAPTCHA_SECRET_KEY` in the `.env` file.

**Note**: In domains, fill localhost

        Google-recaptcha-admin: https://www.google.com/recaptcha/admin/create

2. Enter the gmail credentials for sending mails to the users. Copy/paste the email address to the variable named `MAIL_USERNAME` and the app password to the variable named `MAIL_PASSWORD` in the `.env` file. To get the app password, follow these steps:

   1. Go to your Google Account, https://myaccount.google.com/

   2. Select Security.

   3. Under "Signing in to Google," select App Passwords.

   4. At the bottom, choose `Select app` and choose the app you're using and then `Select device` and choose the device you’re using and then Generate.
   5. The App Password is the 16-character code in the yellow bar on your device.

   **Note**: You must setup two factor authentication in order to allow the app password.

   For more info refer, https://support.google.com/accounts/answer/185833

To test the notification service create a new firebase project and follow these steps:

1.  In the Firebase console, open Settings > [Service Accounts](https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk).

2.  Click Generate New Private Key, then confirm by clicking Generate Key.

3.  Securely store the JSON file containing the key.

4.  Run the following command to set the key in the environment variable:

        Linux/macOS:

                export GOOGLE_APPLICATION_CREDENTIALS="/home/user/Downloads/service-account-file.json"

        Windows:

                $env:GOOGLE_APPLICATION_CREDENTIALS="C:\Users\username\Downloads\service-account-file.json"

5.  Install the [Firebase CLI](https://firebase.google.com/docs/cli#install_the_firebase_cli).

6.  Copy the `firebase_options.dart` file as it will be modified.

7.  Run the following commands in the project directory of talawa mobile app:

    - `firebase login`
    - `dart pub global activate flutterfire_cli`
    - `flutterfire configure`

8.  Select the project you created in the Firebase console in step 2.

9.  Add iOS and android platforms to the project.

10. Overwrite the `firebase_options.dart` file if asked so.

11. Copy the keys to `.env` file, for how to set keys refer to `.env.sample` file.

12. Undo the changes made to the `firebase_options.dart` file by pasting the old content from step 2.

# Installing required packages/dependencies

Run the following command to install the packages and dependencies required by talawa-api:-

        npm run install

# Running/accessing talawa-api

Talawa-api development server runs two processes simultaneously in the background. They are:-

1. `GraphQL codegen:-` This watches for changes in the graphQL type definition files and generates corresponding typescript types in the background. This results in good code editor experience with typescript.

2. `GraphQL api server:-` This runs the talawa graphQL api in directly using the typescript files without emitting them as javascript files. It also watches for changes in the code files and restarts the server if it detects any changes.

Run the following command to start talawa-api development server:-

        npm run dev

By default talawa-api runs on port 4000 on your system's localhost. It is available on the following endpoint:-

        http://localhost:4000/graphql

If port 4000 is not free on your system you can pass a custom environment variable named `PORT` to the script to make it use a different port on your system's localhost. Here's a command showing how to do it:-

        PORT=5000 npm run dev

Now talawa-api will be accessible on the following endpoint:-

        http://localhost:5000/graphql

# Running tests

You can run the tests for talawa-api using this command:-

        npm run test

# Installation using docker(for docker users)

We've written docker and docker compose configuration files if you want to run talawa-api inside docker containers.

We are not listing every possible thing you need to know about docker in the following steps. We expect you to have minimum working knowledge with docker if you're using this approach. If you don't know anything about docker it's better to either learn about docker first or just follow the steps mentioned before this section. Also, make sure that you have plenty of free storage on your system as docker downloads a lot of large images.

**Note:-** `Our configuration assumes that ports 27017 and 4000 are free on your system's localhost.`

We have written the docker configuration in such a way that along with talawa-api mongodb is also started inside a docker container. Both of them communicate with each other internally. This is done so you don't have to manually set up a mongodb database and then connect it to the talawa-api docker container yourselves. Within the docker environment this mongodb container is accessible using this connection string:-

        mongodb://talawa_mongodb:27017/<DATABASE_NAME>?retryWrites=true&w=majority

We have mapped this mongodb docker container to port `27017` of your system's localhost. Make sure that port `27017` is free on your system's localhost or you'll get an error. To access this mongodb container on your system use this connection string:-

        mongodb://localhost:27017/<DATABASE_NAME>?retryWrites=true&w=majority

Build the `docker` image that will support talawa-api

        sudo docker-compose build

We have mapped talawa-api docker container to port `4000` of your system's localhost. Make sure that port `4000` is free on your system's localhost or you'll get an error. To start the talawa-api docker container run this command while being in the root directory of cloned talawa-api folder:-

        sudo docker-compose up

This will start up both talawa-api and mongodb docker containers. Then you can access the talawa-api container using this endpoint:-

        http://localhost:4000/graphql
