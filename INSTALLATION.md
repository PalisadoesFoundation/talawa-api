# Installation

Talawa API is a `node.js` application. It can be setup to run via `Docker` or node's default package manager `npm`.

## Docker

Follow these steps to get the api running using Docker.

**Note:** Docker downloads a lot of large images, if you are short on storage or with slow internet connection prefer using standard development installation.

1. Install <strong>[Docker](https://docs.docker.com/get-docker/)</strong> if you have not installed it.
2. Clone this repo to your local machine

        git clone https://github.com/PalisadoesFoundation/talawa-api
        cd talawa-api
        npm install

3. Talawa-API uses a configuration file named `.env` in the root directory. It is not a part of the repo and you will need to create it. There is a sample configuration file named `.env.sample` in the root diretory. Create a new `.env` file by copying the contents of the `.env.sample` file.

       cp .env.sample .env

4. Generate an `ACCESS_TOKEN_SECRET` using the `openessl` command below and copy the result to the `ACCESS_TOKEN_SECRET` section of the `.env` file.

        openssl rand -hex 32

5. Generate an `REFRESH_TOKEN_SECRET` using the `openessl` command below and copy the result to the `REFRESH_TOKEN_SECRET` section of the `.env` file.

        openssl rand -hex 32

6. Add the MongoDB URL that `talawa-api` will need to use to get access to the database to the `.env`. file.

        mongodb://mongo:27017/talawa-api
      
   - where 
     - `mongodb` is the name of the container.
     - `mongo` is the name of the image which is also the database.
     - `27017` is the port to connect to the `mongo` container.
     - `talawa-api` is the name of the database.
   

7. When finished, your `.env` file should have the following fields filled in.

    - ACCESS_TOKEN_SECRET
    - REFRESH_TOKEN_SECRET
    - MONGO_DB_URL

    Please review the contents of the `.env.sample` file for additional details.

8. Build the `docker` image that will support `talawa-api`

        sudo docker-compose build

9. Start the `docker` container. This is the command you will use to start the server after reboots.

        sudo docker-compose up

10. To stop the `docker` container, this is the command you can use.

        sudo docker-compose down

## Standard Installation

Follow these steps to get the API running.

1. Install these **mandatory** dependencies if you don't already have them:
    - [Nodejs](https://nodejs.org/en/)
    
2. Install these **optional** dependencies if you don't already have them:
    - Talawa-API requires a `MongoDB` database. This can be provided either as a hosted `MongoDB` cloud service or installed locally on your machine.
       * If you are going to install the database on a **system you control**, then follow these [MongoDB installation instructions](https://docs.mongodb.com/manual/administration/install-community/) 
       * If you don't have enough resources on your system or looking to store data using a **cloud service**, then you can use [MongoDB Atlas](https://docs.atlas.mongodb.com/). This method doesn't require any installation and it's free to use. To configure the database service, go through their [docs](https://docs.atlas.mongodb.com/).
       * **Note:** If you are running MongoDB on a remote system, either a cloud service or a system under your control, then ensure you have provided the correct access permissions and firewall openings for the VM/server/service where the MongoDB is hosted.
3. Clone this repo to your local machine

        git clone https://github.com/PalisadoesFoundation/talawa-api
        cd talawa-api
        npm install

4. Talawa-API uses a configuration file named `.env` in the root directory. It is not a part of the repo and you will need to create it. There is a sample configuration file named `.env.sample` in the root diretory. Create a new `.env` file by copying the contents of the `.env.sample` file.

        cp .env.sample .env

5. Generate an `ACCESS_TOKEN_SECRET` using the `openessl` command below and copy the result to the `ACCESS_TOKEN_SECRET` section of the `.env` file.

        openssl rand -hex 32

6. Generate an `REFRESH_TOKEN_SECRET` using the `openessl` command below and copy the result to the `REFRESH_TOKEN_SECRET` section of the `.env` file.

        openssl rand -hex 32

7. Add the MongoDB URL that `talawa-api` will need to use to get access to the database to the `.env`. file.

    - If MongoDB is running on your local system for data storage then the generic format of the URL would be:

        ```
        mongodb://localhost:27017/<DB_NAME>?retryWrites=true&w=majority
        ```
        * Where `<DB_NAME>` is the name of the MongoDB database.

    - If you are using a MongoDB cloud service for data storage, then the generic format of the URL would be:

        ```
        mongodb+srv://<USERNAME>:<PASSWORD>@<SERVER_URL>/<DB_NAME>?retryWrites=true&w=majority
        ```
        
        * Where:
            - `<USERNAME>` is your cloud service user name.
            - `<PASSWORD>` is your cloud service password.
            - `<SERVER_URL>` is your cloud service server URL.
            - `<DB_NAME>` is your cloud service database name.
        * Your cloud service may call this URL a `connect` string. Search for the word `connect` in your online database dashboard to find it.

8. Get the google recaptcha secret key from `google-recaptcha-admin` for reCAPTCHA v2 and "I'm not a robot" Checkbox, and copy the key to the `RECAPTCHA_SECRET_KEY` section of the `.env` file.

- Note: In domains, fill localhost

        Google-recaptcha-admin: https://www.google.com/recaptcha/admin/create

9. Enter the gmail credentials for sending mails to the users. In `MAIL_USERNAME` enter email address and in `MAIL_PASSWORD` enter app password.
- To get the app password, follow these steps:
  
  * Go to your Google Account, https://myaccount.google.com/
  * Select Security.
  * Under "Signing in to Google," select App Passwords.
  * At the bottom, choose Select app and choose the app you using and then Select device and choose the device you’re using and then Generate.
  * The App Password is the 16-character code in the yellow bar on your device.
  * Paste that App Password in `MAIL_PASSWORD`.

-  Note: You must setup two factor authentication in order to allow the app password.

- For more info refer, https://support.google.com/accounts/answer/185833

10. When finished, your `.env` file should have the following fields filled in.

    - ACCESS_TOKEN_SECRET
    - REFRESH_TOKEN_SECRET
    - MONGO_DB_URL
    - RECAPTCHA_SECRET_KEY
    - MAIL_USERNAME
    - MAIL_PASSWORD

    Please review the contents of the `.env.sample` file for additional details.

11.  Install required node packages.

        npm install
 
12. To test the notification service create a new firebase project:

- In the Firebase console, open Settings > [Service Accounts](https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk).

- Click Generate New Private Key, then confirm by clicking Generate Key.

- Securely store the JSON file containing the key.

- Run the following command to set the key in the environment variable:
        
  - Linux/macOS: `export GOOGLE_APPLICATION_CREDENTIALS="/home/user/Downloads/service-account-file.json"`
  
  - Windows: `$env:GOOGLE_APPLICATION_CREDENTIALS="C:\Users\username\Downloads\service-account-file.json"`

-
    1. Install the [Firebase CLI](https://firebase.google.com/docs/cli#install_the_firebase_cli).
    2. Copy the `firebase_options.dart` file as it will be modified.
    3. Run the following commands in the project directory of talawa mobile app:
        - `firebase login`
        - `dart pub global activate flutterfire_cli`
        - `flutterfire configure`
    4. Select the project you created in the Firebase console in step 2.
    5. Add iOS and android platforms to the project.
    6. Overwrite the `firebase_options.dart` file if asked so.
    7. Copy the keys to `.env` file, for how to set keys refer to `.env.sample` file.
    8. Undo the changes made to the `firebase_options.dart` file by pasting the old content from step 2.

13. Start the `talawa-api` server using the below command in the same terminal.

        npm start

14. To stop the server after making changes. Press `CTRL + C` in the terminal where the above command is executed.

# Testing
You can run `talawa-api` tests using this command
```
npm run test
```

## Automated Installation

This method installs the Talawa API automatically. Follow these steps to get the API running using ```npm```.

1. Install these dependencies if you don't already have them
   - [MongoDB](https://docs.mongodb.com/manual/administration/install-community/)
   - [NodeJS](https://nodejs.org/en/)<br>
   <strong>Note:</strong><em>If you do not have MongoDB on your own system, you can proceed with the connection string. Please ensure the right access permissions and firewall openings for the VM/server where the MongoDB is hosted.</em>
2. Clone this repo to your local machine

   ```sh
   git clone https://github.com/PalisadoesFoundation/talawa-api
   cd talawa-api
   npm run setup
   ```

