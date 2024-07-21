{
  description = "Development environment for Talawa API";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config = {
            allowUnfree = true;
          };
        };
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = [
            pkgs.git
            pkgs.nodejs
            pkgs.typescript
            pkgs.fnm
            pkgs.redis
          ];

          preBuild = ''
            echo "PreBuild: Setting up the development environment..."

            # Ensure npm uses a user-writable directory
            mkdir -p ~/.npm-global
            npm config set prefix '~/.npm-global'
            export PATH=~/.npm-global/bin:$PATH

            case "$(uname)" in
              Linux)
                # Linux-specific settings
                echo 1 > /proc/sys/vm/overcommit_memory || true
                #export LC_ALL=en_US.UTF-8
                export LANG=en_US.UTF-8
                ;;
              Darwin)
                # macOS-specific settings
                export LC_ALL=en_US.UTF-8
                export LANG=en_US.UTF-8
                ;;
              CYGWIN*|MINGW32*|MSYS*|MINGW*)
                # Windows-specific settings
                echo "Running on Windows"
                ;;
              *)
                echo "Unknown OS"
                ;;
            esac
          '';

          buildPhase = ''
            echo "Building the project..."
            npm config set registry https://registry.npmjs.org/
            npm install
          '';

          installPhase = ''
            echo "InstallPhase: Installing dependencies and setting up the environment..."

            # Setup FNM
            if [ -d "$HOME/.fnm" ]; then
              export PATH="$HOME/.fnm/bin:$PATH"
              eval "$(fnm env)"
            else
              echo "FNM not found"
            fi

            # Setup Redis
            export REDIS_CONF_FILE=$PWD/redis.conf
            mkdir -p $PWD/redis_data
            echo "dir $PWD/redis_data" > $REDIS_CONF_FILE
            redis-server $REDIS_CONF_FILE &

            # Set environment variables
            export NODE_ENV=development
            export REDIS_URL=redis://localhost:6379

            echo "Installing Node.js dependencies..."
            npm config set registry https://registry.npmjs.org/
            npm install
          '';

          postInstall = ''
            echo "Starting the development server..."
            npm run dev
          '';
        };
      }
    );
}

