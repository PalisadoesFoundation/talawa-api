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
      - [10.1.1 Setting Permissions and Owner for check_permissions.sh](#1011-setting-permissions-and-owner-for-check_permissionssh)
      - [10.1.2 Modify sudoers file to allow talawa-api to run chmod and chown without password prompt](#1012-modify-sudoers-file-to-allow-talawa-api-to-run-chmod-and-chown-without-password-prompt)
      - [10.1.3 Run check_permissions.sh once to correct permissions for other scripts](#1013-run-check_permissionssh-once-to-correct-permissions-for-other-scripts)
    - [10.2 Setting up Cronjobs](#102-setting-up-cronjobs)
      - [10.2.1 Cron job to run check_permissions.sh](#1021-cron-job-to-run-check_permissionssh)
      - [10.2.2 Cron job to run cert_renew.sh](#1022-cron-job-to-run-cert_renewsh)
      - [10.2.3 Cron job to run reset_mongo.sh](#1023-cron-job-to-run-reset_mongosh)
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

After that, install Docker:
```bash
sudo apt-get install docker.io -y
```

Finally, install Docker Compose:

```bash
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```


## 2. Repository Setup

Create a new directory and clone the Talawa API repository:

```bash
mkdir develop
cd develop
git clone https://github.com/PalisadoesFoundation/talawa-api.git
cd talawa-api
npm install
npm run setup
```

## 3. Docker Configuration

To allow commands to run without sudo, execute the following:

```bash
sudo groupadd docker
sudo usermod -aG docker $USER
newgrp docker
rm -fr ~/.docker/
```

## 4. Running the Containers

Start the containers and import sample data:

```bash
docker-compose up -d --build
npm run import:sample-data
```

## 5. Firewall Setup

Enable the firewall and allow SSH, HTTP, and HTTPS:
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
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
    
    - For the first secret:
        
        - Name: `API_DEMO_HOST`
        - Value: `api-demo.talawa.io` (Replace with your hostname)
    - For the second secret:
        - Name: `API_DEMO_USERNAME`
        - Value: `talawa-api`
    - For the third secret:
        - Name: `API_DEMO_SSH_KEY`
        - Value: (Paste the **private** SSH key you copied in previous step )
    - For the fourth secret:
        - Name: `API_DEMO_PORT`
        - Value: `22`

These secrets are crucial for the GitHub Actions workflow to connect securely to your VPS and deploy the Talawa API.

## 10. Cron Jobs

### 10.1 Setting up Scripts:
Copy the following scripts from **/home/talawa-api/develop/talawa-api/scripts/cloud-api-demo** to **/usr/local/bin**:
`cert_renew.sh`
`check_permissions.sh`
`deploy.sh`
`reset_mongo.sh`

#### 10.1.1 Setting Permissions and Owner for check_permissions.sh:

```bash
sudo chmod 700 /usr/local/bin/check_permissions.sh
sudo chown talawa-api /usr/local/bin/check_permissions.sh
```

#### 10.1.2 Modify sudoers file to allow talawa-api to run chmod and chown without password prompt:
- Open sudoers file with sudo visudo.
- Add the following line:
```bash
talawa-api ALL=(ALL) NOPASSWD: /bin/chmod, /bin/chown
```
- Save and exit the editor

#### 10.1.3 Run check_permissions.sh once to correct permissions for other scripts:
```bash
/usr/local/bin/check_permissions.sh
```
Executing check_permissions.sh once will ensure that the correct permissions are applied to the other scripts in the specified directory.

### 10.2 Setting up Cronjobs:

#### 10.2.1 Cron job to run check_permissions.sh 
This cron job will execute check_permissions.sh every midnight, ensuring that the correct permissions are maintained for the scripts : 
```bash
echo "0 0 * * * talawa-api /usr/local/bin/check_permissions.sh" | sudo tee /etc/cron.d/check_permissions
```
#### 10.2.2 Cron job to run cert_renew.sh
This cron job will execute `cert_renew.sh` every 90 days, ensuring that the certificates are renewed in a timely manner:
```bash
echo "0 0 */90 * * talawa-api /usr/local/bin/cert_renew.sh" | sudo tee /etc/cron.d/cert_renew
```
#### 10.2.3 Cron job to run reset_mongo.sh
This cron job will execute `reset_mongo.sh` every 24 hours, ensuring that the MongoDB is reset on a daily basis:
```bash
echo "0 0 * * * talawa-api /usr/local/bin/reset_mongo.sh" | sudo tee /etc/cron.d/reset_mongo
```
#### 10.3 Logging for cron jobs

1. **Create the logrotate configuration file:**

```bash
sudo nano /etc/logrotate.d/talawa-api-cron
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
    create 640 talawa-api talawa-api
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
- `create 640 talawa-api talawa-api`: Creates new log files with the specified permissions and ownership. In this case, both the owner and group are set to talawa-api.
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