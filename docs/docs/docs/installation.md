# Talawa API Installation Guide

This guide covers the installation process for Talawa API, including both quick one-click installation and manual setup options.

## Quick Start (One-Click Installation)

The fastest way to get Talawa API running is using our one-click installation scripts. These scripts automatically install all prerequisites and configure the environment.

### Windows

Run in PowerShell **as Administrator**:

```powershell
irm https://raw.githubusercontent.com/PalisadoesFoundation/talawa-api/develop/scripts/install/install.ps1 | iex
```

**Requirements:**
- Windows 10/11 or Windows Server 2016+
- PowerShell 5.1 or later
- Administrator privileges

The script will install:
- Chocolatey (package manager)
- fnm (Fast Node Manager)
- Node.js 24.x
- pnpm (package manager)
- Docker Desktop (if Docker mode selected)

### Linux (Ubuntu/Debian)

```bash
curl -fsSL https://raw.githubusercontent.com/PalisadoesFoundation/talawa-api/develop/scripts/install/install.sh | bash
```

**Requirements:**
- Ubuntu 20.04+ or Debian 10+
- sudo privileges
- curl installed

The script will install:
- fnm (Fast Node Manager)
- Node.js 24.x
- pnpm (package manager)
- Docker and Docker Compose (if Docker mode selected)

### macOS

```bash
curl -fsSL https://raw.githubusercontent.com/PalisadoesFoundation/talawa-api/develop/scripts/install/install.sh | bash
```

**Requirements:**
- macOS 10.15 (Catalina) or later
- Homebrew (will be installed if missing)
- Admin password for installations

The script will install:
- Homebrew (if not present)
- fnm (Fast Node Manager)
- Node.js 24.x
- pnpm (package manager)
- Docker Desktop (if Docker mode selected)

### WSL (Windows Subsystem for Linux)

The installation script automatically detects WSL and provides guidance:

```bash
curl -fsSL https://raw.githubusercontent.com/PalisadoesFoundation/talawa-api/develop/scripts/install/install.sh | bash
```

**Docker Options for WSL:**
1. **Docker Desktop** (Recommended): Enable WSL2 backend integration
   - [Docker Desktop WSL2 Guide](https://docs.docker.com/desktop/wsl/)
2. **Native Docker in WSL2**: Install Docker directly in WSL
   - [Install Docker in WSL2](https://docs.docker.com/engine/install/ubuntu/)

## Installation Modes

Both scripts support two installation modes:

### Docker Mode (Recommended for Development)

- Runs all services (PostgreSQL, MinIO, Redis) in containers
- Easiest setup with minimal configuration
- Ideal for development and testing

### Local Mode

- Requires manual installation of PostgreSQL, MinIO, and Redis
- More control over service configurations
- Better for production-like environments

## Command-Line Options

### Linux/macOS Script Options

```bash
# Skip prerequisite installation (use existing tools)
./install.sh --skip-prereqs

# Force Docker mode
./install.sh --docker

# Force local mode
./install.sh --local

# Combine options
./install.sh --skip-prereqs --docker
```

### Windows Script Options

```powershell
# Skip prerequisite installation
.\install.ps1 -SkipPrereqs

# Force Docker mode
.\install.ps1 -Docker

# Force local mode
.\install.ps1 -Local
```

## Post-Installation

After installation completes:

1. **Navigate to the project directory:**
   ```bash
   cd talawa-api
   ```

2. **Start the development server:**
   ```bash
   pnpm dev
   ```

3. **Access the API:**
   - GraphQL Playground: http://localhost:4000/graphql
   - Health Check: http://localhost:4000/health

## Troubleshooting

### Common Issues

#### Docker not running
If you see "Docker is installed but not running":
- **Windows/macOS**: Launch Docker Desktop from your applications
- **Linux**: Run `sudo systemctl start docker`

#### pnpm not found after installation
If pnpm is not found in PATH:
1. Close and reopen your terminal
2. Or run: `source ~/.bashrc` (Linux) / `source ~/.zshrc` (macOS)

#### Permission denied errors
- **Linux/macOS**: Ensure you have sudo privileges
- **Windows**: Run PowerShell as Administrator

#### fnm not loading
Add to your shell profile (`.bashrc`, `.zshrc`, etc.):
```bash
eval "$(fnm env --use-on-cd)"
```

### Getting Help

- [GitHub Issues](https://github.com/PalisadoesFoundation/talawa-api/issues)
- [Documentation](https://docs.talawa.io)
- [Community Discord](https://discord.gg/palisadoes)

## Manual Installation

For manual installation without the one-click scripts, see:
- [INSTALLATION.md](../INSTALLATION.md) - Detailed manual setup guide
- [Docker Setup](./docker-setup.md) - Docker-specific configuration
