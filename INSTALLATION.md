# Setting Up The MongoDB Database

A running instance of mongodb and it's connection string is required for making use of talawa-api. We're listing a few common approaches to get a running instance of mongodb database :-

1. Using a hosted(remote) mongodb database :- MongoDB Atlas is the easiest way to get a running instance of mongodb database. We will be making use of mongodb atlas though mongodb can be hosted using other platforms as well. Follow the setup guide on [mongodb atlas docs](https://www.mongodb.com/docs/atlas/getting-started/). If you want to use some other mongodb hosted database please do your own research.

2. Using a mongodb database installed on your local system natively :- Follow the setup guide on [mongodb docs](https://www.mongodb.com/docs/manual/administration/install-community/) for your respective operating system.

3. Using a containerized mongodb docker container on your local system :- Follow the setup guide using this [video tutorial](https://www.youtube.com/watch?v=uklyCSKQ1Po).

**Note:** If you are running mongodb on a remote system, either a cloud service or a system under your control, then ensure you have provided the correct access permissions and firewall openings for the VM/server/service where the mongodb is hosted.

Paste the connection string for your database as the value for environment variable named `MONGO_DB_URL` inside the `.env` file present in the root directory of this application.

# Talawa-api Installation

Talawa API is mainly written and built using `node.js` and `typescript`. We are providing some common approaches to set it up on your system.

## Installation using the standard method

Pre-requisites :-

1. A running mongodb database connection string. Refer to `Setting Up The MongoDB Database` section for more information.

2. NodeJS installed on your local system(version 14 or above preferrable). It's best to make use of a node version manager to manage nodejs versions on your system. Two popular node version managers currently are [fnm](https://github.com/Schniz/fnm) and [nvm](https://github.com/nvm-sh/nvm). Follow the setup guide for either of them and install NodeJS.

Follow these steps to get the API running :-

1.  Clone this repo to your local machine :-

        git clone https://github.com/PalisadoesFoundation/talawa-api

2.  Change directory to cloned folder :-

        cd talawa-api

3.  Install the npm packages required by talawa-api :-

        npm install

4.  Talawa-API uses a configuration file named `.env` in the root directory. It is not a part of the repo and you will need to create it. There is a sample configuration file named `.env.sample` in the root directory. Create a new `.env` file by copying the contents of the `.env.sample` file.

        cp .env.sample .env

5.  Generate an `ACCESS_TOKEN_SECRET` using the `openessl` command below and copy the result to the `ACCESS_TOKEN_SECRET` section of the `.env` file.

        openssl rand -hex 32

6.  Generate an `REFRESH_TOKEN_SECRET` using the `openessl` command below and copy the result to the `REFRESH_TOKEN_SECRET` section of the `.env` file.

        openssl rand -hex 32

7.  Follow the `Setting Up Mongodb Database` section to set up a mongodb database and get a mongodb database connection string. Paste that connection string in `.env` file under the variable named `MONGO_DB_URL`.

8.  Get the google recaptcha secret key from `google-recaptcha-admin` for reCAPTCHA v2 and "I'm not a robot" Checkbox, and copy the key to the `RECAPTCHA_SECRET_KEY` section of the `.env` file.

    **Note**: In domains, fill localhost

        Google-recaptcha-admin: https://www.google.com/recaptcha/admin/create

9.  Enter the gmail credentials for sending mails to the users. In `MAIL_USERNAME` enter email address and in `MAIL_PASSWORD` enter app password. To get the app password, follow these steps:

    - Go to your Google Account, https://myaccount.google.com/
    - Select Security.
    - Under "Signing in to Google," select App Passwords.
    - At the bottom, choose Select app and choose the app you using and then Select device and choose the device you’re using and then Generate.
    - The App Password is the 16-character code in the yellow bar on your device.
    - Paste that App Password in `MAIL_PASSWORD`.

    **Note**: You must setup two factor authentication in order to allow the app password.

    For more info refer, https://support.google.com/accounts/answer/185833

10. When finished, your `.env` file should have the following fields filled in :-

    - ACCESS_TOKEN_SECRET
    - REFRESH_TOKEN_SECRET
    - MONGO_DB_URL
    - RECAPTCHA_SECRET_KEY
    - MAIL_USERNAME
    - MAIL_PASSWORD

    Please review the contents of the `.env.sample` file for additional details.

11. Install the required dependencies.

        npm install

12. To test the notification service create a new firebase project:

- In the Firebase console, open Settings > [Service Accounts](https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk).

- Click Generate New Private Key, then confirm by clicking Generate Key.

- Securely store the JSON file containing the key.

- Run the following command to set the key in the environment variable:

  - Linux/macOS: `export GOOGLE_APPLICATION_CREDENTIALS="/home/user/Downloads/service-account-file.json"`

  - Windows: `$env:GOOGLE_APPLICATION_CREDENTIALS="C:\Users\username\Downloads\service-account-file.json"`

  1.  Install the [Firebase CLI](https://firebase.google.com/docs/cli#install_the_firebase_cli).
  2.  Copy the `firebase_options.dart` file as it will be modified.
  3.  Run the following commands in the project directory of talawa mobile app:

      - `firebase login`
      - `dart pub global activate flutterfire_cli`
      - `flutterfire configure`

  4.  Select the project you created in the Firebase console in step 2.
  5.  Add iOS and android platforms to the project.
  6.  Overwrite the `firebase_options.dart` file if asked so.
  7.  Copy the keys to `.env` file, for how to set keys refer to `.env.sample` file.
  8.  Undo the changes made to the `firebase_options.dart` file by pasting the old content from step 2.

13. The command below will run the talawa-api server in development environment.

        npm run dev

14. To stop the server use this keybind in the terminal where the above command is executed :-

        CTRL + C

## Installation using docker

Pre-requisites :-

1. `Docker` installed on your system. Follow the setup guide on [docker docs](https://docs.docker.com/get-docker/).
2. Free port `27017` on your system's localhost.

**Note:** We are not listing every possible thing you need to know about docker in the following steps. We expect you to have minimum working knowledge with docker if you're using this approach. If you don't know anything about docker it's better to either learn about docker first or go with the steps mentioned in the section `Installation using standard method`. Also docker downloads a lot of large images, if you are short on storage or with slow internet connection prefer using the standard method.

Follow these steps to get the api running :-

1.  Clone this repo to your local machine

        git clone https://github.com/PalisadoesFoundation/talawa-api

2.  Change directory to cloned folder :-

        cd talawa-api

3.  Talawa-API uses a configuration file named `.env` in the root directory. It is not a part of the repo and you will need to create it. There is a sample configuration file named `.env.sample` in the root directory. Create a new `.env` file by copying the contents of the `.env.sample` file.

    cp .env .env.sample

4.  Generate an `ACCESS_TOKEN_SECRET` using the `openessl` command below and copy the result to the `ACCESS_TOKEN_SECRET` section of the `.env` file.

        openssl rand -hex 32

5.  Generate an `REFRESH_TOKEN_SECRET` using the `openessl` command below and copy the result to the `REFRESH_TOKEN_SECRET` section of the `.env` file.

        openssl rand -hex 32

6.  We have written the docker configuration in such a way that along with talawa-api mongodb is also started inside a docker container. Both of them communicate with each other internally. This is done so you don't have to manually set up a mongodb database and then connect it to the talawa-api docker container yourselves. Within the docker environment this mongodb container is accessible using this connection string :-

        mongodb://talawa_mongodb:27017/<DATABASE_NAME>?retryWrites=true&w=majority

    We have mapped this mongodb docker container to port `27017` of your system's localhost. Make sure that port `27017` is free on your system's localhost or you'll get an error. To access this mongodb container on your system use this connection string :-

        mongodb://localhost:27017/<DATABASE_NAME>?retryWrites=true&w=majority

7.  When finished, your `.env` file should have the following fields filled in.

    - ACCESS_TOKEN_SECRET
    - REFRESH_TOKEN_SECRET
    - MONGO_DB_URL

    Please review the contents of the `.env.sample` file for additional details.

8.  Build the `docker` image that will support talawa-api

        sudo docker-compose build

9.  To start the talawa-api docker container run this command while being in the talawa-api folder directory :-

        sudo docker-compose up

    **Note** :- There is one caveat here. `Docker` might not automatically start each time you reboot your system. To start docker after a system reboot on linux machines run this command :-

        sudo systemctl start docker

    To make docker start automatically after system reboots follow [start docker on boot](https://docs.docker.com/engine/install/linux-postinstall/#configure-docker-to-start-on-boot) guide.

10. To stop the talawa-api docker container run this command while being in the talawa-api folder directory :-

        sudo docker-compose down

## Automated Installation

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
