# One-Click Installation

This guide explains how to use the one-click installation scripts to quickly set up Talawa API on your system.

## Prerequisites

The installation scripts will automatically install these requirements if not present:

| Package | Required | Description |
|---------|----------|-------------|
| **Git** | Yes | Version control system |
| **Node.js** | Yes | v23.7.0 (as specified in package.json) |
| **pnpm** | Yes | v10.26.1 (package manager) |
| **Docker** | No | Only required for Docker installation mode |

## Quick Start

### Linux / macOS

```bash
# Clone the repository
git clone https://github.com/PalisadoesFoundation/talawa-api.git
cd talawa-api

# Run the installation script
./scripts/install/install.sh
```

### Windows (PowerShell)

```powershell
# Clone the repository
git clone https://github.com/PalisadoesFoundation/talawa-api.git
cd talawa-api

# Run the installation script
.\scripts\install\install.ps1
```

## Installation Modes

### Docker Mode (Recommended)

Use Docker mode for a containerized, isolated environment:

```bash
# Linux / macOS
./scripts/install/install.sh --docker

# Windows
.\scripts\install\install.ps1 -Docker
```

**When to use Docker mode:**
- Production-like environment
- Consistent behavior across team members
- No need to install dependencies directly on host

### Local Mode

Use Local mode for development with direct access to Node.js:

```bash
# Linux / macOS
./scripts/install/install.sh --local

# Windows
.\scripts\install\install.ps1 -Local
```

**When to use Local mode:**
- Active development with hot reloading
- Debugging with IDE integration
- Lighter resource usage

## Command Options

### Linux / macOS Options

| Option | Description |
|--------|-------------|
| `--docker` | Install with Docker (default) |
| `--local` | Install for local development |
| `--skip-prereqs` | Skip prerequisite installation |
| `--verbose` or `-v` | Enable verbose logging |
| `--help` or `-h` | Show help message |

### Windows PowerShell Options

| Option | Description |
|--------|-------------|
| `-Docker` | Install with Docker (default) |
| `-Local` | Install for local development |
| `-SkipPrereqs` | Skip prerequisite installation |

## After Installation

After the installation script completes, run:

```bash
pnpm run setup
```

This will guide you through:
1. Environment configuration
2. Database setup
3. Initial configuration options

## Troubleshooting

### Node.js Version Mismatch

If you see a warning about Node.js version, the script uses [fnm](https://github.com/Schniz/fnm) to manage Node versions:

```bash
fnm install 23.7.0
fnm use 23.7.0
```

### Permission Issues (Linux/macOS)

If the script isn't executable:

```bash
chmod +x scripts/install/install.sh
```

### Execution Policy (Windows)

If PowerShell blocks the script:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Platform-Specific Notes

### WSL (Windows Subsystem for Linux)

The installation script automatically detects WSL and uses appropriate settings.

### macOS with Homebrew

The script will use Homebrew to install missing dependencies.

### Linux Package Managers

The script supports apt (Debian/Ubuntu), dnf (Fedora), and pacman (Arch).
