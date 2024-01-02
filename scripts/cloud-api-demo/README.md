# Talawa API Cloud Instance Setup Guide

This guide provides step-by-step instructions for setting up a cloud instance of the Talawa API for developers. It is assumed that: 
- You are doing this on a server that is running Ubuntu 22.04.1 or higher.
- You want to deploy the 'develop' branch to the instance.
- You have sudo privileges. 
- You are executing all commands under the home directory of the 'talawa-api' user.

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

Install NGINX and configure it:

```bash
sudo apt install nginx
sudo vi /etc/nginx/sites-available/default
```

Add the following to the location part of the server block:
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

Check the NGINX configuration and restart it:
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

