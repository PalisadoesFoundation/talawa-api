# Talawa API Installation Guide

This guide provides step-by-step instructions for setting up the Talawa API service on a Linux system using systemd.

## Prerequisites

- Node.js (version 20.18.0 or current version the app is running on) (Ensure the Linux Node.js version matches the app version)
- nvm (Node Version Manager)
- tsx (TypeScript execution environment should be installed globally. Command : npm install -g tsx )
- A Linux system with systemd
- For development, first run manually to see if it is working. Check the `.env` file to ensure `NODE_ENV` is set to `development`.
- For production, first build the app to generate the `dist` folder, then set `NODE_ENV` to `production`.
- Ensure you provide the correct paths for each configuration to avoid errors.
- The service dynamically starts the development and production server based on the `.env` configuration, so verify it before making any changes.
- Always check the log files to identify errors.

## Steps

1. **Create the Systemd Service File**:
   - Create a file named `talawa-api.service` in the `/etc/systemd/system` directory. Ensure you have root privileges.

2. **Edit the `talawa-api.service` File**:
   - Modify the `talawa-api.service` file as required (e.g., `ExecStart`, `WorkingDirectory`, `User`, `Group`). You can find how to edit these fields in the `talawa-api.service` file located in `example/linux/systemd`.

3. **Copy the Configuration**:
   - Copy the text into the `talawa-api.service` file located in `/etc/systemd/system` and save it.

4. **Edit the `Talawa-api.sh` Script**:
   - Edit the `Talawa-api.sh` script to set the project directory and log file path:
   
     ```bash
     # Change to the project directory
     cd /usr/local/talawa-api

     # Define log file
     LOG_FILE="/var/log/talawa-api.log"
     ```

## Commands to Follow in Sequence

1. **Reload the Systemd Configuration**:
   sudo systemctl daemon-reload

2. **Enable the Talawa API Service (required the first time):**:
   sudo systemctl enable talawa-api.service

3. **Start the Talawa API Service:**:
   sudo systemctl start talawa-api.service

4. **Check the Status of the Talawa API Service:**:
   sudo systemctl status talawa-api.service

5. **View the Logs in Real-Time**:
   sudo journalctl -u talawa-api.service -f

6. **Stop the Talawa API Service:**:
   sudo systemctl stop talawa-api.service

7. **Restart the Talawa API Service:**:
   sudo systemctl restart talawa-api.service

8. **Also, you can see direct log stored in /var/log/talawa-api.log :**:
   sudo cat /var/log/talawa-api.log


    