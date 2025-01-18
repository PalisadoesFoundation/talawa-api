# Talawa API Installation Guide

This guide provides step-by-step instructions for setting up the Talawa API service on a Linux system using systemd.

## Prerequisites

- **Node.js** (Install system-wide at version specified in package.json)
- **tsx** (TypeScript execution environment, install globally with `npm install -g tsx`)
- A Linux system with **systemd**
- **Root access** or `sudo` privileges for service installation
- **Dedicated system user** `talawa` for running the service (security best practice)
- **MongoDB** installed and running (required for Talawa API)
- **Redis** installed and running (required for Talawa API)
- Proper file permissions on `/path/to/your/talawa-api` (e.g., /opt/talawa-api or /usr/local/talawa-api)
- For development:
  - Ensure `.env` file sets `NODE_ENV=development`
  - Run the service manually to verify functionality
- For production:
  - Build the app to generate the `dist` folder
  - Ensure `.env` file sets `NODE_ENV=production`
- **Log file setup**:
  - Ensure a log file exists at `/var/log/talawa-api.log` with appropriate permissions and ownership
- Verify Node.js version in your system matches the version required by `package.json`

## Steps

### 1. Create a Dedicated System User

- Create a user named `talawa` for running the service:

```bash
sudo adduser --system --no-create-home --group talawa
```

- Verify the user creation:

```bash
id talawa
```

### 2. Create the Systemd Service File

- Create the `talawa-api.service` file in the `/etc/systemd/system/` directory with root privileges
- Check following placeholders:
  - `ExecStart` (path to your `Talawa-api.sh` script: `/path/to/your/talawa-api/example/linux/systemd/Talawa-api.sh`)
  - `WorkingDirectory` (root directory of your Talawa API project: `/path/to/your/talawa-api`)
  - `ReadOnlyPaths` (root directory of your Talawa API project: `/path/to/your/talawa-api`)
  - `User, Group` (use the `talawa` user and group created earlier)
- Refer to the example in `/path/to/your/talawa-api/example/linux/systemd/talawa-api.service` for guidance
- Copy `talawa-api.service` then paste it inside `/etc/systemd/system/`
- Make sure `talawa-api.service` is owned by root

### 3. Set Up the `Talawa-api.sh` Script

- Edit the script to specify:
  - **Project directory** (e.g., `/path/to/your/talawa-api` will own by `$CODEROOT` supplied by service as enviroment)
  - **Log file path** (e.g., `/var/log/talawa-api.log`)
  - Ensure that the development (`src/index.ts`) and production (`dist/index.js`) paths are correctly set
  - Make sure `Talawa-api.sh` is executable and owned by user `talawa`. Log file should also be owned by user `talawa`
  - Give execute permission to `Talawa-api.sh:

    ```bash
    chmod u+x Talawa-api.sh
    ```

### 4. Configure the Environment

- Ensure the `.env` file exists in the project directory and contains the appropriate configuration
- Add the following environment variables:
  - `NODE_ENV=development` or `NODE_ENV=production`

### 5. Verify Log File and Permissions

- Create the log file if it does not exist:

```bash
sudo touch /var/log/talawa-api.log
sudo chown talawa:talawa /var/log/talawa-api.log
sudo chmod 664 /var/log/talawa-api.log
```

- Ensure the log file owner matches the service user (e.g., `talawa`)

### 6. Set Up Log Rotation

- Create a new logrotate configuration file for Talawa API:

```bash
sudo nano /etc/logrotate.d/talawa-api
```

- Add the following configuration:

```plaintext
/var/log/talawa-api.log {
    su talawa talawa
    weekly
    rotate 4
    compress
    missingok
    notifempty
    create 664 talawa talawa
    # Prevent symlink attacks
    nolinkasym
    # Delete old versions of log files
    delaycompress
    # Don't rotate empty log files
    notifempty
    postrotate
        systemctl restart talawa-api.service > /dev/null 2>&1 || true
    endscript
}
```

- Verify logrotate setup:

```bash
sudo logrotate -f /etc/logrotate.d/talawa-api
sudo logrotate -v /etc/logrotate.conf
sudo logrotate -d /etc/logrotate.conf
```

- -f for forced rotation, -v for verbose rotation, -d for debuging mode rotation.
- To confirm log rotation, check the rotated logs:

```bash
ls -la /var/log/talawa-api.log*
```

### 7. Install Dependencies

- Install required Node.js version with `fnm`:

```bash
fnm install <node_version>
fnm use <node_version>
```

- Install dependencies:

```bash
npm install
```

- Globally install `tsx` if not already installed:

```bash
npm install -g tsx
```

### 8. Enable and Start the Service

1. Reload the systemd configuration:


### 9. Verify the Installation

- Check the status of the service:

```bash
sudo systemctl status talawa-api.service
```

- View logs in real-time(Always use this if you stuck!):

```bash
sudo journalctl -u talawa-api.service -f
```

- Check for errors:

```bash
sudo journalctl -u talawa-api.service -p err
```

- Verify the service configuration:

```bash
sudo systemd-analyze verify talawa-api.service
```

- Verify service dependencies:

```bash
sudo systemctl list-dependencies talawa-api.service
```

## Notes

- Ensure the `Talawa-api.sh` script has executable permissions:

```bash
chmod +x /path/to/Talawa-api.sh
```

- Adjust `LimitNOFILE` and security-related settings in the `talawa-api.service` file as needed for your environment
- For production, ensure the `dist` folder exists by running:

```bash
npm run build
```

- If you encounter any issues, refer to the logs in `/var/log/talawa-api.log` or use `journalctl`
- Don't try to create a global variable to store paths for use in both systemd service and script files. Global variables (like `/path/to/your/talawa-api`) will not work properly as systemd services run in a separate environment. While there are various suggested solutions (using `/etc/environment`, `/etc/default/`, or `Environment` and `EnvironmentFile` directives), these approaches can complicate service execution and are not recommended.
- While systemd supports environment variables through EnvironmentFile and Environment directives, using absolute paths in both the service file and script ensures consistent behavior across different environments and makes debugging easier.

### Additional Steps for Troubleshooting

1. Verify Node.js and `tsx` installation:

```bash
node -v
tsx -v
```

2. Ensure MongoDB and Redis are running:

```bash
sudo systemctl status mongod
sudo systemctl status redis
```
