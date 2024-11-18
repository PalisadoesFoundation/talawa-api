## Local Setup (Without Docker)
### Make sure you have [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git), [node.js and npm](https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-20-04) installed locally. Make sure you are using [latest version](https://www.freecodecamp.org/news/how-to-update-node-and-npm-to-the-latest-version/) of node and npm.

### Clone and install dependencies

    git clone https://github.com/PalisadoesFoundation/talawa-api
    cd talawa-api
    git checkout develop-postgres
    npm install

### Install PostgreSQL

Go to the [official dowload page](https://www.postgresql.org/download) and choose the steps based on your os.

#### For Ubuntu (Linux)

1. Download with the follwing command;
    ```bash
    sudo apt install curl ca-certificates
    sudo install -d /usr/share/postgresql-common/pgdg
    sudo curl -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc --fail https://www.postgresql.org/media/keys/ACCC4CF8.asc
    sudo sh -c 'echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
    sudo apt update
    sudo apt -y install postgresql
    ```
2. Switch to `postgres` user using
    ```bash
    sudo -i -u postgres
    ```
    if you face any problem regarding password, exit and reset the password with
    ```bash
    exit
    sudo passwd postgres
    ```
3. Run `psql` command
    ```bash
    sudo -i -u postgres
    psql
    ```
    if you still face problem do the following;
    ```
    sudo vim /etc/postgresql/[version]/main/pg_hba.conf
    ```
    and change this line 
    ```text
    local   all             postgres                                md5
    ``` 
    to
    ```text
    local   all             postgres                                trust
    ```
    and save the file. Then try again
    and you will see something like this in your terminal
    ```
    postgres@ip-172-31-33-163:~$ psql
    psql (17.1 (Ubuntu 17.1-1.pgdg24.04+1))
    Type "help" for help.

    postgres=# 
    ```
    and then exit from it using
    ```bash
    \q
    ```
4. Create a new database `talawa` using
    ```bash
    createdb talawa
    ```
    if it **already exists**, delete and try after running
    ```bash
    dropdb talawa
    ```
    and switch to `talawa` database using
    ```bash
    psql -d talawa
    ```

5. Check connection configuration using
    ```bash
    \conninfo
    ```
    and you will get back something like this in your terminal. **Default** port is **5432**
    ```bash
    You are connected to database "talawa" as user "postgres" via socket in "/var/run/postgresql" at port "5432".
    ```
6. Set and **note** your **password**
    ```bash
    \password
    ```
    
    check your password after exiting with `\q` from `talawa`. **Default** port is **5432**
    ```bash
    psql "postgresql://postgres:YOUR_PASSWORD@localhost:5432/talawa"
    ```
    if you are able to enter `talawa`, your password is set correctly.
    8. Set `ssl` to `false` 
    at first check with `SHOW ssl;` inside `talawa`, if it shows 
    ```bash
     ssl 
    -----
     off
    (1 row)
    ```
    then you can **skip to next step**. Else follow the below in `postgres` user after exiting `talawa` with `/q`
    ```bash
    sudo vim /etc/postgresql/<version>/main/postgresql.conf
    ```
    find `ssl = on` and set it to `ssl = off`
    Restart `postgres` (from default user) and connect `talawa` db again using
    ```bash
    sudo systemctl restart postgresql
    sudo -i -u postgres
    psql -d talawa
    ```
    now if you see the `ssl` status using 
    ```bash
    SHOW ssl;
    ```
    it will show you something like this
    ```bash
    ssl 
    -----
    off
    (1 row)
    ```
7.  Both host and test host are `localhost`

### Configure Database (.env)
 Move to your default user with `exit` command. Go to `envFiles` and copy `.env.development` file at the `root` and `rename` it to `.env` with
 ```bash
 cd envFiles 
 cp .env.development ../ && cd ..
 mv .env.development .env
 ```

changes of `line 12 to 18` will be the followings, modify the `PORT`(5432 by default) and `PASSWORD`.
```text
API_POSTGRES_DATABASE=talawa
API_POSTGRES_HOST=localhost
API_POSTGRES_PASSWORD=YOUR_PASSWORD
API_POSTGRES_PORT=5432
API_POSTGRES_SSL_MODE=false
API_POSTGRES_TEST_HOST=localhost
API_POSTGRES_USER=postgres
```

### Generate migration and apply 
1. generate migration using:
    ```bash
    npm run generate_drizzle_migrations
    ```
2. apply the migration:
    ```bash
    npm run apply_drizzle_migrations
    ```
3. Verify initialization:
    ```bash
    sudo -u postgres psql talawa
    ```
    and then
    enter `\dt` in your `talawa` database and you will get to see multiple rows with `Schema`, `Name`, `Type` and `Owner`
    and exit with `\q`

### Import Sample Data
Run this to switch to postgres user and import sample data
    ```bash
    sudo -u postgres npm run db:seed
    ```
### Generate GraphQL schema
Run this to generate graphql schema
```bash
npm run generate_graphql_sdl_file
```
### Run the application using
```bash
npm run start_development_server
```
The `graphiql` endpoint can at accessed at
```bash
localhost:8080/graphiql
```
