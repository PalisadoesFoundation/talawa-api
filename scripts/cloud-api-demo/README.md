# Talawa API Cloud Instance Setup Guide

This guide provides step-by-step instructions for setting up a cloud instance of the Talawa API for developers. It is assumed that:

- You are doing this on a server that is running Ubuntu 22.04.1 or higher.
- You want to deploy the 'develop' branch to the instance.
- You have sudo privileges.
- You are executing all commands under the home directory of the 'talawa-api' user.

## Table Of Contents

- [1. Virtual Private Server (VPS) Setup](#1-virtual-private-server-vps-setup)
- [2. Repository Setup](#2-repository-setup)
- [3. Docker Configuration](#3-docker-configuration)
- [4. Running the Containers](#4-running-the-containers)
- [5. Firewall Setup](#5-firewall-setup)
- [6. SSH Keys for GitHub Actions](#6-ssh-keys-for-github-actions)
- [7. GitHub Action Setup](#7-github-action-setup)
- [8. Cron Jobs](#8-cron-jobs)
  - [8.1 Setting up Scripts](#81-setting-up-scripts)
    - [8.1.1 Setting Permissions and Owner for correct_permissions.py](#811-setting-permissions-and-owner-for-correct_permissionspy)
    - [8.1.2 Modify sudoers file to allow talawa-api to run chmod and chown without password prompt](#812-modify-sudoers-file-to-allow-talawa-api-to-run-chmod-and-chown-without-password-prompt)
    - [8.1.3 Run correct_permissions.py once to correct permissions for other scripts](#813-run-correct_permissionspy-once-to-correct-permissions-for-other-scripts)
  - [8.2 Setting up Cronjobs](#82-setting-up-cronjobs)
    - [8.2.1 Cron job to run correct_permissions.py](#821-cron-job-to-run-correct_permissionspy)
    - [8.2.3 Cron job to run reset_database.py](#823-cron-job-to-run-reset_databasepy)
  - [8.3 Logging for cron jobs](#83-logging-for-cron-jobs)

### 1. Virtual Private Server (VPS) Setup

First, update your package lists and upgrade the system:

```bash
sudo apt-get update && sudo apt-get upgrade
```

Next, install curl:

```bash
sudo apt-get install curl
```

Then, install Node Version Manager (nvm):

```bash
sudo curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash

source ~/.bashrc

nvm install --lts
```

### 2. Repository Setup

Create a new directory and clone the Talawa API repository:

```bash
git clone https://github.com/PalisadoesFoundation/talawa-api.git .
cd talawa-api
npm install
npm run setup
```

### 3. Docker Configuration

After that, to setup docker, first remove all the conflicting packages:

```bash
for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do sudo apt-get remove $pkg; done
```

Before you install Docker Engine for the first time on a new host machine, you need to set up the Docker repository. Afterward, you can install and update Docker from the repository.

#### 3.1 Set up docker's repository:

##### 3.1.1 Add Docker's official GPG key:

```bash
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
```

##### 3.1.2 Add the repository to apt sources:

```bash
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
```

#### 3.2 Install the Docker packages:

```bash
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

#### 3.3 Allow docker to run without sudo

```bash
sudo groupadd docker
sudo usermod -aG docker $USER
```

### 4. Running the Containers

Start the containers and import sample data:

```bash
cd ~/talawa-api/
docker compose -f docker-compose.dev.yaml up -d
npm run import:sample-data
```

### 5. Firewall Setup

Enable the firewall and allow SSH, HTTP, and HTTPS:

```bash
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
sudo ufw status
```

### 6. SSH Keys for GitHub Actions

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

### 7. GitHub Action Setup

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

### 8. Cron Jobs

#### 8.1 Setting up Scripts:

Copy the following scripts from **/home/talawa-api/develop/talawa-api/scripts/cloud-api-demo** to **/usr/local/bin/scripts**:
`renew_certificates.py`
`correct_permissions.py`
`deploy.py`
`reset_database.py`
`create_env.py`

##### 8.1.1 Setting Permissions and Owner for correct_permissions.py:

```bash
sudo chmod 700 /usr/local/bin/scripts/correct_permissions.py
sudo chown talawa-api /usr/local/bin/scripts/correct_permissions.py
```

##### 8.1.2 Modify sudoers file to allow talawa-api to run chmod and chown without password prompt:

- Open sudoers file with sudo visudo.
- Add the following line:

```bash
talawa-api ALL=(ALL) NOPASSWD: /bin/chmod, /bin/chown
```

- Save and exit the editor

##### 8.1.3 Run `correct_permissions.py` once to correct permissions for other scripts:

```bash
python3 correct_permissions.py --user talawa-api --files /usr/local/bin/scripts/deploy.py /usr/local/bin/scripts/reset_database.py /usr/local/bin/scripts/renew_certificates.py /usr/local/bin/scripts/create_env.py
```

Executing `correct_permissions.py` once will ensure that the correct permissions are applied to the other scripts in the specified directory.

#### 8.2 Setting up Cronjobs:

##### 8.2.1 Cron job to run correct_permissions.py

This cron job will execute correct_permissions.py every midnight, ensuring that the correct permissions are maintained for the scripts :

```bash
echo "0 0 * * * talawa-api python3 correct_permissions.py --user talawa-api --files /usr/local/bin/scripts/deploy.py /usr/local/bin/scripts/reset_database.py /usr/local/bin/scripts/renew_certificates.py /usr/local/bin/scripts/create_env.py" | sudo tee /etc/cron.d/check_permissions
```

##### 8.2.3 Cron job to run reset_database.py

This cron job will execute `reset_database.py` every 24 hours, ensuring that the MongoDB is reset on a daily basis:

```bash
echo "0 * * * * talawa-api python3 reset_database.py --mongo-container develop-mongodb-1 --mongo-db talawa-api --repo-dir /home/talawa-api/develop" | sudo tee /etc/cron.d/reset_mongo
```

### 8.3 Logging for cron jobs

This will set up logging for the cron jobs and manage log rotation using logrotate.

