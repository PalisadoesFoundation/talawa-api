# Pulls the node.js v16 docker image from docker hub.
FROM node:16

# Sets '/usr/src/app' as the default working directory to be used
# by the subsequent commands and the generated container. That means
# './' will correspond to '/usr/src/app/' inside the container onwards.
WORKDIR /usr/src/app

# Copies 'package.json' and 'package-lock.json' files.
# '*'is a wildcard character and here it means any filenames
# starting with 'package' and ending with '.json'.
COPY package*.json ./

# Installs all the dependencies listed in 'package.json' file under the
# node_modules folder in the 'WORKDIR' directory inside the container.
RUN npm install

# Copies all the remaining files/folders to 'WORKDIR' except 'node_modules'
# and 'dist' folders because they're listed in '.dockerignore' file.
COPY . .

# Runs the dev command to start the node.js server in development mode.
CMD ["npm","run","dev"]