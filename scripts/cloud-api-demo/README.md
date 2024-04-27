# Talawa API Cloud Instance Setup Guide

This guide provides step-by-step instructions for setting up a cloud instance of the Talawa API for developers. It is assumed that:

- You are doing this on a server that is running Ubuntu 22.04.1 or higher.
- You want to deploy the 'develop' branch to the instance.
- You have sudo privileges.
- You are executing all commands under the home directory of the 'talawa-api' user.

# Table Of Contents

- [Talawa API Cloud Instance Setup Guide](#talawa-api-cloud-instance-setup-guide)
  - [1. Virtual Private Server (VPS) Setup](#1-virtual-private-server-vps-setup)
  - [2. Repository Setup](#2-repository-setup)
  - [3. Docker Configuration](#3-docker-configuration)
  - [4. Running the Containers](#4-running-the-containers)
  - [5. Firewall Setup](#5-firewall-setup)
  - [6. NGINX Installation and Configuration](#6-nginx-installation-and-configuration)
    - [6.1 Install NGINX and configure it](#61-install-nginx-and-configure-it)
    - [6.2 Add the following to the location part of the server block](#62-add-the-following-to-the-location-part-of-the-server-block)
    - [6.3 Check the NGINX configuration and restart it](#63-check-the-nginx-configuration-and-restart-it)
  - [7. SSL Configuration with LetsEncrypt](#7-ssl-configuration-with-letsencrypt)
  - [8. SSH Keys for GitHub Actions](#8-ssh-keys-for-github-actions)
  - [9. GitHub Action Setup](#9-github-action-setup)
  - [10. Cron Jobs](#10-cron-jobs)
    - [10.1 Setting up Scripts](#101-setting-up-scripts)
      - [10.1.1 Setting Permissions and Owner for correct_permissions.py](#1011-setting-permissions-and-owner-for-check_permissionssh)
      - [10.1.2 Modify sudoers file to allow talawa-api to run chmod and chown without password prompt](#1012-modify-sudoers-file-to-allow-talawa-api-to-run-chmod-and-chown-without-password-prompt)
      - [10.1.3 Run correct_permissions.py once to correct permissions for other scripts](#1013-run-check_permissionssh-once-to-correct-permissions-for-other-scripts)
    - [10.2 Setting up Cronjobs](#102-setting-up-cronjobs)
      - [10.2.1 Cron job to run correct_permissions.py](#1021-cron-job-to-run-check_permissionssh)
      - [10.2.2 Cron job to run renew_certificates.py](#1022-cron-job-to-run-cert_renewsh)
      - [10.2.3 Cron job to run eset_database.py](#1023-cron-job-to-run-reset_mongosh)
    - [10.3 Logging for cron jobs](#103-logging-for-cron-jobs)

## 1. Virtual Private Server (VPS) Setup

First, update your package lists and upgrade the system:

```bash
sudo apt-get update && sudo apt-get upgrade
```

Next, install curl:

```bash
sudo apt-get install curl
```

Then, install Node Version Manager (nvm):

```bash
sudo curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash

source ~/.bashrc

nvm install --lts
```

## 2. Repository Setup

Create a new directory and clone the Talawa API repository:

```bash
mkdir develop
cd develop
git clone https://github.com/PalisadoesFoundation/talawa-api.git .
npm install
```

## 3. Docker Configuration

After that, to setup docker first remove all the conflicting packages:

```bash
for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do sudo apt-get remove $pkg; done
```

Before you install Docker Engine for the first time on a new host machine, you need to set up the Docker repository. Afterward, you can install and update Docker from the repository.

### 3.1 Set up docker's repository:

#### 3.1.1 Add Docker's official GPG key:

```bash
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
```

#### 3.1.2 Add the repository to apt sources:

```bash
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
```

### 3.2 Install the Docker packages:

```bash
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### 3.3 Allow docker to run without sudo

```bash
sudo groupadd docker
sudo usermod -aG docker $USER
```

- **Note : Reboot the machine to apply the changes**

## 4. Running the Containers

Start the containers and import sample data:

```bash
docker-compose up -d --build
npm run import:sample-data
```

## 5. Firewall Setup

Enable the firewall and allow SSH, HTTP, and HTTPS:

```bash
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
sudo ufw status
```

## 6. NGINX Installation and Configuration

### 6.1 Install NGINX and configure it:

```bash
sudo apt install nginx
sudo vi /etc/nginx/sites-available/default
```

### 6.2 Add the following to the location part of the server block:

```bash
server_name yourdomain.com www.yourdomain.com;

location / {
    proxy_pass http://localhost:4000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

### 6.3 Check the NGINX configuration and restart it:

```bash
sudo nginx -t
sudo nginx -s reload
```

## 7. SSL Configuration with LetsEncrypt

Add SSL with LetsEncrypt:

```
sudo add-apt-repository ppa:certbot/certbot
sudo apt-get update
sudo apt-get install python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 8. SSH Keys for GitHub Actions

For secure communication between GitHub Actions and the API VPS, you'll need to generate SSH keys and add the public key to the authorized keys on your VPS. Here's how you can do it:

1. On your VPS, generate an SSH key pair:

   ```bash
   ssh-keygen -t ed25519 -a 200 -C "your_email@example.com"
   ```

   This command creates an Ed25519 SSH key pair with increased key derivation iterations for added security. Replace "your_email@example.com" with your actual email address.

2. Copy the public key for your VPS:

   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```

3. Paste it to your ~/.ssh/authorized_keys file on vps.

4. Copy the **private** key using -

   ```bash
   cat ~/.ssh/id_ed25519
   ```

## 9. GitHub Action Setup

To enable continuous integration with GitHub Actions, you need to set up the necessary secrets for the workflow. These secrets allow secure communication between the GitHub Actions workflow and your VPS. Here are the steps to set up the required secrets:

1. Navigate to your GitHub repository.
2. Click on the "Settings" tab.
3. In the left sidebar, select "Secrets."
4. Click on the "New repository secret" button.

The application requires the following secrets to be set:

- `API_DEMO_HOST`: Your hostname (e.g., `api-demo.talawa.io`)
- `API_DEMO_USERNAME`: Your API username (e.g., `talawa-api`)
- `API_DEMO_SSH_KEY`: Your **private** SSH key
- `API_DEMO_SSH_PORT`: Your port number (e.g., `22`)
- `API_DEMO_RECAPTCHA_SECRET_KEY`: Your reCAPTCHA secret key
- `API_DEMO_MAIL_USERNAME`: Your mail username
- `API_DEMO_MAIL_PASSWORD`: Your mail password (Not your main passowrd, App password you created)
- `API_DEMO_LAST_RESORT_SUPERADMIN_EMAIL`: Your last resort superadmin email

Please replace the example values with your actual values.

These secrets are crucial for the GitHub Actions workflow to connect securely to your VPS and deploy the Talawa API.

## 10. Cron Jobs

### 10.1 Setting up Scripts:

Copy the following scripts from **/home/talawa-api/develop/talawa-api/scripts/cloud-api-demo** to **/usr/local/bin/scripts**:
`renew_certificates.py`
`correct_permissions.py`
`deploy.py`
`reset_database.py`
`create_env.py`

#### 10.1.1 Setting Permissions and Owner for correct_permissions.py:

```bash
sudo chmod 700 /usr/local/bin/scripts/correct_permissions.py
sudo chown talawa-api /usr/local/bin/scripts/correct_permissions.py
```

#### 10.1.2 Modify sudoers file to allow talawa-api to run chmod and chown without password prompt:

- Open sudoers file with sudo visudo.
- Add the following line:

```bash
talawa-api ALL=(ALL) NOPASSWD: /bin/chmod, /bin/chown
```

- Save and exit the editor

#### 10.1.3 Run `correct_permissions.py` once to correct permissions for other scripts:

```bash
python3 correct_permissions.py --user talawa-api --files /usr/local/bin/scripts/deploy.py /usr/local/bin/scripts/reset_database.py /usr/local/bin/scripts/renew_certificates.py /usr/local/bin/scripts/create_env.py
```

Executing `correct_permissions.py` once will ensure that the correct permissions are applied to the other scripts in the specified directory.

### 10.2 Setting up Cronjobs:

#### 10.2.1 Cron job to run correct_permissions.py

This cron job will execute correct_permissions.py every midnight, ensuring that the correct permissions are maintained for the scripts :

```bash
echo "0 0 * * * talawa-api python3 correct_permissions.py --user talawa-api --files /usr/local/bin/scripts/deploy.py /usr/local/bin/scripts/reset_database.py /usr/local/bin/scripts/renew_certificates.py /usr/local/bin/scripts/create_env.py" | sudo tee /etc/cron.d/check_permissions
```

#### 10.2.2 Cron job to run renew_certificates.py

This cron job will execute `renew_certificates.py` every 90 days, ensuring that the certificates are renewed in a timely manner:

```bash
echo "0 0 * * * talawa-api python3 renew_certificates.py --config-dir ~/.certbot/config --logs-dir ~/.certbot/logs --work-dir ~/.certbot/work" | sudo tee /etc/cron.d/cert_renew
```

#### 10.2.3 Cron job to run reset_database.py

This cron job will execute `reset_database.py` every 24 hours, ensuring that the MongoDB is reset on a daily basis:

```bash
echo "0 * * * * talawa-api python3 reset_database.py --mongo-container develop-mongodb-1 --mongo-db talawa-api --repo-dir /home/talawa-api/develop" | sudo tee /etc/cron.d/reset_mongo
```

#### 10.3 Logging for cron jobs

1. **Create the logrotate configuration file:**

```bash
sudo nano /etc/logrotate.d/talawa-api-cron
sudo mkdir -p /var/log/talawa-api/
sudo chown talawa-api /var/log/talawa-api/
```

2. **Add the following content to the file:**

```log
/var/log/talawa-api/cron.log {
    rotate 7
    daily
    missingok
    notifempty
    compress
    delaycompress
    create 640 talawa-api
    sharedscripts
    postrotate
        systemctl restart cron
    endscript
}
```

**Explanation:**

- `rotate 7`: Retains the last 7 rotated log files.
- `daily`: Rotates the log file daily.
- `missingok`: Ignores errors if the log file is missing.
- `notifempty`: Does not rotate the log file if it is empty.
- `compress`: Compresses rotated log files.
- `delaycompress`: Delays compression until the next rotation cycle.
- `create 640 talawa-api`: Creates new log files with the specified permissions and ownership. In this case, the owner is set to talawa-api.
- `sharedscripts`: Runs the `postrotate` script only once even if multiple log files are rotated.
- `postrotate` ... endscript: Defines the actions to be taken after log rotation, in this case, restarting the cron service.

3. **Save and exit the text editor (Ctrl + X, then Y, then Enter in nano).**

4. **Restart Cron Service:**
   Apply the logrotate changes by restarting the cron service:

```bash
sudo systemctl restart cron
```

Now, the cron job output will be logged to `/var/log/talawa-api/cron.log`, and log rotation will be managed by logrotate according to the specified configuration. Adjust the log rotation parameters in the logrotate configuration file as needed.

This will set up logging for the cron jobs and manage log rotation using logrotate.
