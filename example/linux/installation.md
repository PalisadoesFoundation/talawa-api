# Talawa API Installation Guide

This guide provides step-by-step instructions for setting up the Talawa API service on a Linux system using systemd.

## Prerequisites

- **fnm** (Fast Version Manager)
- **Node.js** (version specified in your Talawa API's `package.json`)
- **tsx** (TypeScript execution environment, install globally with `npm install -g tsx`)
- A Linux system with **systemd**
- **Root access** or `sudo` privileges for service installation
- **Dedicated system user** `talawa` for running the service (security best practice)
- **MongoDB** installed and running (required for Talawa API)
- **Redis** installed and running (required for Talawa API)
- Proper file permissions on `/usr/local/talawa-api` directory . Where your talawa-api is installed.
- For development:
  - Ensure `.env` file sets `NODE_ENV=development`.
  - Run the service manually to verify functionality.
- For production:
  - Build the app to generate the `dist` folder.
  - Ensure `.env` file sets `NODE_ENV=production`.
- **Log file setup**:
  - Ensure a log file exists at `/var/log/talawa-api.log` with appropriate permissions and ownership.
- Verify Node.js version in your system matches the version required by `package.json`.
- Install `jq` for parsing JSON data (`sudo apt install jq` or equivalent).

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

- Create the `talawa-api.service` file in the `/etc/systemd/system/` directory with root privileges.
- Update the following placeholders with actual paths:
  - `ExecStart` (path to your `Talawa-api.sh` script).
  - `WorkingDirectory` (root directory of your Talawa API project).
- Refer to the example in `example/linux/systemd/talawa-api.service` for guidance.
- Copy talawa-api.service edit the path name then paste it inside `/etc/systemd/system/`
- Make sure `talawa-api.service` should be executable.

### 3. Set Up the `Talawa-api.sh` Script

- Edit the script to specify:
  - **Project directory** (e.g., `/usr/local/talawa-api`)
  - **Log file path** (e.g., `/var/log/talawa-api.log`)
  - Ensure that the development (`src/index.ts`) and production (`dist/index.js`) paths are correctly set.
  - Make sure `Talawa-api.sh` should be executable

### 4. Configure the Environment

- Ensure the `.env` file exists in the project directory and contains the appropriate configuration.
- Add the following environment variables:
  - `NODE_ENV=development` or `NODE_ENV=production`.

### 5. Verify Log File and Permissions

- Create the log file if it does not exist:
  ```bash
  sudo touch /var/log/talawa-api.log
  sudo chown talawa:talawa /var/log/talawa-api.log
  sudo chmod 664 /var/log/talawa-api.log
  ```
- Ensure the log file owner matches the service user (e.g., `talawa`).

### 6. Install Dependencies

- Install required Node.js version with `fnm`:
  ```bash
  fnm install <node_version>
  fnm use <node_version>
  ```
  Replace `<node_version>` with the version specified in `package.json` (`engines.node`).
- Install dependencies:
  ```bash
  npm install
  ```
- Globally install `tsx` if not already installed:
  ```bash
  npm install -g tsx
  ```
- Install `jq`:
  ```bash
  sudo apt install jq
  ```

### 7. Enable and Start the Service

1. Reload the systemd configuration:
   ```bash
   sudo systemctl daemon-reload
   ```
2. Enable the service:
   ```bash
   sudo systemctl enable talawa-api.service
   ```
3. Start the service:
   ```bash
   sudo systemctl start talawa-api.service
   ```

### 8. Verify the Installation

- Check the status of the service:
  ```bash
  sudo systemctl status talawa-api.service
  ```
- View logs in real-time:
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
- Adjust `LimitNOFILE` and security-related settings in the `talawa-api.service` file as needed for your environment.
- For production, ensure the `dist` folder exists by running:
  ```bash
  npm run build
  ```
- If you encounter any issues, refer to the logs in `/var/log/talawa-api.log` or use `journalctl`.

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