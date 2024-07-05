{ pkgs ? import <nixpkgs> {} }:

let
  PROJECT_DIR = "/mnt/c/Users/av1th/talawa-api";
in

pkgs.mkShell {
  buildInputs = [
    pkgs.git
    pkgs.fnm
    pkgs.nodejs
    pkgs.typescript
    pkgs.yarn
    pkgs.nodePackages.npm
  
    pkgs.redis
  ];

  shellHook = ''
    echo "Setting up environment for development"
    echo "Project directory: ${PROJECT_DIR}"
    echo "Home directory: $HOME"

    # Initialize fnm (Fast Node Manager)
    export FNM_DIR="$HOME/.fnm"
    if [ ! -d "$FNM_DIR" ]; then
      echo "Installing fnm..."
      mkdir -p "$FNM_DIR"
      curl -fsSL https://fnm.vercel.app/install | bash
    fi
    export PATH="$FNM_DIR/bin:$PATH"
    eval "$(fnm env)"

    # Use the desired Node.js version with fnm
    fnm install --lts
    fnm use --lts

  

    # Start Redis
    echo "Starting Redis..."
    if [ -f /etc/redis.conf ]; then
      redis-server /etc/redis.conf &
    else
      echo "Redis config file not found, using default settings."
      redis-server &
    fi
    
    # Navigate to the project directory
    cd "${PROJECT_DIR}"

    echo "Installing dependencies..."
    npm install
    echo "Development environment is ready"
  '';
}
