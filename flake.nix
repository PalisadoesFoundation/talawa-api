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
    in {
      packages.default = pkgs.stdenv.mkDerivation {
        name = "talawa-api";
        src = ./.;

        buildInputs = [
          pkgs.nodejs
          pkgs.fnm
          pkgs.redis
          pkgs.glibcLocales
        ];

        unpackPhase = "cp -r $src/* .";

        installPhase = ''
          export HOME=$PWD
          export PATH=$PATH:$HOME/.fnm/bin
          mkdir -p $HOME/.npm-global
          export npm_config_prefix=$HOME/.npm-global

          export LANG=en_US.UTF-8
          export LC_ALL=en_US.UTF-8
          export LOCALE_ARCHIVE=${pkgs.glibcLocales}/lib/locale/locale-archive

          #fnm use --install-if-missing $(cat .nvmrc)
	
          echo "Starting redis server..."
          redis-server --daemonize yes
          
          echo "Installing dependencies..."
          npm install --verbose

           # setting environment variables
              export MONGO_DB_URL="mongodb://localhost:27017/"
              export REDIS_HOST="localhost"
              export REDIS_PORT=6379
              export SERVER_PORT=4040

          echo "Building the API server..."
          npm run build

        # Assuming the build outputs to a dist folder or similar
        cp -r dist/* $out/bin
        '';
        postInstall=''
          echo "Building the API server..."
          npm run build

          echo "API server installed successfully."
        '';

        shellHook = ''
          echo "Ready to develop!"
        '';
      };

   

      devShells.default = pkgs.mkShell {
        buildInputs = with pkgs; [
          nodejs
          fnm
          redis
          glibcLocales
          git
        ];

        shellHook = ''
          export HOME=$PWD
          export PATH=$PATH:$HOME/.fnm/bin
          mkdir -p $HOME/.npm-global
          export npm_config_prefix=$HOME/.npm-global

          fnm use --install-if-missing $(cat .nvmrc)

          export LANG=en_US.UTF-8
          export LOCALE_ARCHIVE=${pkgs.glibcLocales}/lib/locale/locale-archive

          redis-server --daemonize yes

          npm install
        # setting environment variables
          export MONGO_DB_URL="mongodb://localhost:27017/"
          export REDIS_HOST="localhost"
          export REDIS_PORT=6379
          export SERVER_PORT=4040

          echo "Starting the API server..."
          npm run dev &

          echo "Development environment is set up."
        '';
      };
    }
  );

}
