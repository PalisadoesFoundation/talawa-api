{description = "Nix flake for Git, Node.js, TypeScript, FNM, and Redis";

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

        shellHook = ''
          echo "Setting up the development environment..."

          case "$(uname)" in
            Linux)
              # Linux-specific settings
              sudo sysctl vm.overcommit_memory=1 || true
              export LC_ALL=C
              export LANG=C
              ;;
            Darwin)
              # macOS-specific settings
              export LC_ALL=C
              export LANG=C
              ;;
            CYGWIN*|MINGW32*|MSYS*|MINGW*)
              # Windows-specific settings
              echo "Running on Windows"
              ;;
            *)
              echo "Unknown OS"
              ;;
          esac

          # Setup FNM
          if [ -d "$HOME/.fnm" ]; then
            export PATH="$HOME/.fnm:$PATH"
            eval "$(fnm env)"
          else
            echo "FNM not found"
          fi

          # Setup Redis
          export REDIS_CONF_FILE=$PWD/redis.conf
          mkdir -p $PWD/redis_data
          echo "dir $PWD/redis_data" > $REDIS_CONF_FILE
          redis-server $REDIS_CONF_FILE &

          echo "Development environment is ready!"
        '';
      };
    });
}
