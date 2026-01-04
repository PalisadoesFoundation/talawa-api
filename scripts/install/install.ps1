#Requires -Version 5.1
<#
.SYNOPSIS
    Talawa API - Windows One-Click Installation Script

.DESCRIPTION
    This script installs all prerequisites for running Talawa API on Windows:
    - Chocolatey (package manager)
    - Git, jq, curl (system utilities)
    - Docker Desktop (optional, based on install mode)
    - fnm (Fast Node Manager)
    - Node.js (version from package.json)
    - pnpm (version from package.json)

.PARAMETER Docker
    Install with Docker support (default)

.PARAMETER Local
    Install for local development (no Docker)

.PARAMETER SkipPrereqs
    Skip prerequisite installation

.EXAMPLE
    .\install.ps1 -Docker
    .\install.ps1 -Local
#>

[CmdletBinding()]
param(
    [switch]$Docker,
    [switch]$Local,
    [switch]$SkipPrereqs
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Validate mutually exclusive parameters
if ($Docker -and $Local) {
    Write-Host "Error: -Docker and -Local cannot be used together. Choose one." -ForegroundColor Red
    exit 1
}

# Determine install mode
if ($Local) {
    $InstallMode = "local"
} else {
    $InstallMode = "docker"
}

# Colors for output (PowerShell 5.1+ supports ANSI on Windows 10+)
function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    
    $colors = @{
        "Red" = "Red"
        "Green" = "Green"
        "Yellow" = "Yellow"
        "Blue" = "Cyan"
        "Cyan" = "Cyan"
    }
    
    # Use fallback color if requested color not in hashtable
    $resolvedColor = if ($colors.ContainsKey($Color)) { $colors[$Color] } else { "White" }
    Write-Host $Message -ForegroundColor $resolvedColor
}

function Write-Info { Write-Host "i " -ForegroundColor Cyan -NoNewline; Write-Host $args[0] }
function Write-Success { Write-Host "√ " -ForegroundColor Green -NoNewline; Write-Host $args[0] }
function Write-Warn { Write-Host "! " -ForegroundColor Yellow -NoNewline; Write-Host $args[0] }
function Write-Err { Write-Host "X " -ForegroundColor Red -NoNewline; Write-Host $args[0] }
function Write-Step { 
    param([int]$Current, [int]$Total, [string]$Message)
    Write-Host "[$Current/$Total] " -ForegroundColor Cyan -NoNewline
    Write-Host $Message
}

# Print banner
function Show-Banner {
    $banner = @"

╔════════════════════════════════════════════════════════╗
║                                                        ║
║   ████████╗ █████╗ ██╗      █████╗ ██╗    ██╗ █████╗   ║
║   ╚══██╔══╝██╔══██╗██║     ██╔══██╗██║    ██║██╔══██╗  ║
║      ██║   ███████║██║     ███████║██║ █╗ ██║███████║  ║
║      ██║   ██╔══██║██║     ██╔══██║██║███╗██║██╔══██║  ║
║      ██║   ██║  ██║███████╗██║  ██║╚███╔███╔╝██║  ██║  ║
║      ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝  ╚═╝  ║
║                                                        ║
║         One-Click Installation Script (Windows)       ║
╚════════════════════════════════════════════════════════╝

"@
    Write-Host $banner -ForegroundColor Cyan
}

# Check if running as administrator
function Test-Administrator {
    $currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    return $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Check if command exists
function Test-CommandExists {
    param([string]$Command)
    
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

# Get repository root
function Get-RepoRoot {
    # Use $PSScriptRoot with fallbacks for different execution contexts
    $scriptDir = if ($PSScriptRoot) { 
        $PSScriptRoot 
    } elseif ($MyInvocation.MyCommand.Path) { 
        Split-Path -Parent $MyInvocation.MyCommand.Path 
    } else { 
        Split-Path -Parent $MyInvocation.ScriptName 
    }
    
    # Navigate up from scripts/install to repo root
    $repoRoot = $scriptDir
    while ($repoRoot -and -not (Test-Path (Join-Path $repoRoot "package.json"))) {
        $parent = Split-Path -Parent $repoRoot
        if ($parent -eq $repoRoot) { break }
        $repoRoot = $parent
    }
    return $repoRoot
}

# Main installation
function Install-TalawaPrerequisites {
    Show-Banner
    
    # Check for admin rights (recommended but not required for all operations)
    if (-not (Test-Administrator)) {
        Write-Warn "Not running as Administrator. Some installations may require elevation."
        Write-Warn "Consider running PowerShell as Administrator for best results."
        Write-Host ""
    }
    
    # Get repo root
    $repoRoot = Get-RepoRoot
    if (-not $repoRoot -or -not (Test-Path (Join-Path $repoRoot "package.json"))) {
        Write-Err "package.json not found. Please run this script from the talawa-api repository."
        exit 1
    }
    
    Push-Location $repoRoot
    
    try {
        Write-Info "Repository root: $repoRoot"
        Write-Info "Installation mode: $InstallMode"
        Write-Host ""
        
        $totalSteps = 8
        $currentStep = 0
        
        #######################################################################
        # Step 1: Install/Check Chocolatey
        #######################################################################
        $currentStep++
        Write-Step $currentStep $totalSteps "Checking Chocolatey package manager..."
        
        if (Test-CommandExists "choco") {
            Write-Success "Chocolatey is already installed"
        } elseif ($SkipPrereqs) {
            Write-Warn "Skipping Chocolatey installation (-SkipPrereqs)"
        } else {
            Write-Info "Installing Chocolatey..."
            
            # Security Note: This uses Chocolatey's official installer over HTTPS.
            # The script is from a trusted source (chocolatey.org) but downloading
            # and executing remote scripts carries inherent risk. Users can review
            # the script first at: https://community.chocolatey.org/install.ps1
            
            # Temporarily allow script execution for this process only (does not persist)
            Set-ExecutionPolicy Bypass -Scope Process -Force
            # Enforce TLS 1.2+ for secure download
            [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
            Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
            
            # Refresh environment
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
            
            Write-Success "Chocolatey installed successfully"
        }
        
        #######################################################################
        # Step 2: Install system dependencies
        #######################################################################
        $currentStep++
        Write-Step $currentStep $totalSteps "Installing system dependencies..."
        
        if ($SkipPrereqs) {
            Write-Warn "Skipping prerequisite installation (-SkipPrereqs)"
        } else {
            if (Test-CommandExists "choco") {
                Write-Info "Installing git, jq, curl via Chocolatey..."
                choco install git jq curl -y --no-progress
                if ($LASTEXITCODE -ne 0) {
                    Write-Warn "Some packages may have failed to install via Chocolatey"
                }
                
                # Refresh environment
                $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
            } else {
                Write-Warn "Chocolatey not available. Please install git, jq, curl manually."
            }
        }
        
        Write-Success "System dependencies checked"
        
        #######################################################################
        # Step 3: Install Docker (optional)
        #######################################################################
        $currentStep++
        Write-Step $currentStep $totalSteps "Checking Docker installation..."
        
        if ($InstallMode -eq "docker") {
            if (Test-CommandExists "docker") {
                $dockerVersion = docker --version 2>$null
                Write-Success "Docker is already installed: $dockerVersion"
            } elseif ($SkipPrereqs) {
                Write-Warn "Skipping Docker installation (-SkipPrereqs)"
            } else {
                Write-Info "Installing Docker Desktop..."
                choco install docker-desktop -y --no-progress
                if ($LASTEXITCODE -ne 0) {
                    Write-Warn "Docker Desktop installation may have failed. Please install manually."
                } else {
                    Write-Warn "Docker Desktop installed. Please:"
                    Write-Warn "  1. Restart your computer"
                    Write-Warn "  2. Launch Docker Desktop and complete setup"
                    Write-Warn "  3. Re-run this script after Docker is running"
                }
            }
        } else {
            Write-Info "Local installation mode - skipping Docker setup"
        }
        
        #######################################################################
        # Step 4: Install fnm (Fast Node Manager)
        #######################################################################
        $currentStep++
        Write-Step $currentStep $totalSteps "Setting up Node.js version manager (fnm)..."
        
        if (Test-CommandExists "fnm") {
            Write-Success "fnm is already installed"
        } else {
            Write-Info "Installing fnm..."
            
            # Try winget first (Windows 11 / Windows 10 with winget)
            if (Test-CommandExists "winget") {
                winget install Schniz.fnm --accept-source-agreements --accept-package-agreements
                if ($LASTEXITCODE -ne 0) {
                    Write-Warn "winget install failed, trying Chocolatey..."
                    if (Test-CommandExists "choco") {
                        choco install fnm -y --no-progress
                        if ($LASTEXITCODE -ne 0) {
                            Write-Err "Failed to install fnm via Chocolatey"
                            exit 1
                        }
                    }
                }
            } elseif (Test-CommandExists "choco") {
                choco install fnm -y --no-progress
                if ($LASTEXITCODE -ne 0) {
                    Write-Err "Failed to install fnm via Chocolatey"
                    exit 1
                }
            } else {
                Write-Err "Neither winget nor Chocolatey available to install fnm"
                Write-Info "Please install fnm manually from: https://github.com/Schniz/fnm"
                exit 1
            }
            
            # Refresh environment
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
            
            Write-Success "fnm installed successfully"
        }
        
        # Initialize fnm for current session
        if (Test-CommandExists "fnm") {
            fnm env --use-on-cd | Out-String | Invoke-Expression
        }
        
        #######################################################################
        # Step 5: Read versions from package.json
        #######################################################################
        $currentStep++
        Write-Step $currentStep $totalSteps "Reading configuration from package.json..."
        
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        
        # Extract Node.js version with null check
        $nodeVersion = if ($packageJson.engines -and $packageJson.engines.node) { $packageJson.engines.node } else { "lts" }
        # Clean version string
        $cleanNodeVersion = $nodeVersion -replace '^[>=^~]+', ''
        if ($cleanNodeVersion -match '^(\d+)') {
            $cleanNodeVersion = $matches[1]
        }
        
        # Extract pnpm version
        $packageManager = $packageJson.packageManager
        if ($packageManager -and $packageManager.StartsWith("pnpm@")) {
            $pnpmVersion = $packageManager -replace '^pnpm@', '' -replace '\+.*$', ''
        } else {
            $pnpmVersion = "latest"
        }
        
        Write-Info "Target Node.js version: $cleanNodeVersion"
        Write-Info "Target pnpm version: $pnpmVersion"
        
        #######################################################################
        # Step 6: Install Node.js
        #######################################################################
        $currentStep++
        Write-Step $currentStep $totalSteps "Installing Node.js v$cleanNodeVersion..."
        
        if (Test-CommandExists "fnm") {
            fnm install $cleanNodeVersion
            if ($LASTEXITCODE -ne 0) {
                Write-Err "Failed to install Node.js v$cleanNodeVersion via fnm"
                exit 1
            }
            fnm use $cleanNodeVersion
            if ($LASTEXITCODE -ne 0) {
                Write-Err "Failed to switch to Node.js v$cleanNodeVersion"
                exit 1
            }
            fnm default $cleanNodeVersion
            
            $nodeInstalled = node --version 2>$null
            Write-Success "Node.js installed: $nodeInstalled"
        } else {
            Write-Err "fnm not available. Please install Node.js v$cleanNodeVersion manually."
            exit 1
        }
        
        #######################################################################
        # Step 7: Install pnpm
        #######################################################################
        $currentStep++
        Write-Step $currentStep $totalSteps "Installing pnpm v$pnpmVersion..."
        
        if (Test-CommandExists "pnpm") {
            $currentPnpm = pnpm --version 2>$null
            Write-Info "pnpm v$currentPnpm found, ensuring v$pnpmVersion..."
        } else {
            Write-Info "Installing pnpm..."
        }
        # Always run npm install - npm handles idempotency and version matching
        npm install -g "pnpm@$pnpmVersion"
        if ($LASTEXITCODE -ne 0) {
            Write-Err "Failed to install pnpm v$pnpmVersion"
            exit 1
        }
        
        $pnpmInstalled = pnpm --version 2>$null
        Write-Success "pnpm installed: v$pnpmInstalled"
        
        #######################################################################
        # Step 8: Install project dependencies
        #######################################################################
        $currentStep++
        Write-Step $currentStep $totalSteps "Installing project dependencies..."
        
        pnpm install
        if ($LASTEXITCODE -ne 0) {
            Write-Err "Failed to install project dependencies"
            exit 1
        }
        
        Write-Success "Project dependencies installed"
        
        #######################################################################
        # Complete
        #######################################################################
        Write-Host ""
        Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host "  Installation completed successfully!" -ForegroundColor Green
        Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host ""
        Write-Info "Installed versions:"
        $nodeVer = node --version 2>$null
        $pnpmVer = pnpm --version 2>$null
        Write-Host "  Node.js: $nodeVer"
        Write-Host "  pnpm:    v$pnpmVer"
        if (Test-CommandExists "docker") {
            $dockerVer = docker --version 2>$null
            Write-Host "  Docker:  $dockerVer"
        }
        Write-Host ""
        Write-Info "To complete setup, run:"
        Write-Host "  pnpm run setup"
        Write-Host ""
        
    } finally {
        Pop-Location
    }
}

# Run installation
Install-TalawaPrerequisites
