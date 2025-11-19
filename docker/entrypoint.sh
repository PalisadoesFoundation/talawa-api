#!/usr/bin/env bash

set -e
# Fix docker.sock permissions, I am not sure if this is the best way, since the docker.sock on the host is also modified. A developer should also change the docker.sock's permissions back to normal. With simply running docker_sock_cleanup.sh
sudo chown -R talawa /var/run/docker.sock
# Execute the original command
if [ $# -gt 0 ]; then
    exec "$@"
else
    exec bash
fi
