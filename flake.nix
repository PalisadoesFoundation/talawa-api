{
  description = "Nix flake for Git, Node.js, TypeScript, FNM, and Redis";

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

            # Set overcommit memory to avoid Redis warning
            sudo sysctl vm.overcommit_memory=1 || true

            # Set the locale to avoid Redis error
            export LC_ALL=C
            export LANG=C

            # Setup FNM
            export PATH="$HOME/.fnm:$PATH"
            eval "$(fnm env)"

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

