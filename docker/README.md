# Docker socket access for plugin-managed containers (dev)

The API devcontainer can control Docker on the host to manage plugin containers (e.g., summarize_t5) via the mounted socket at `/var/run/docker.sock`.

## One-time step (host machine)

Before using any Docker-enabled plugin, grant access to the Docker socket:

```bash
sudo chmod 666 /var/run/docker.sock
```

## Why this is needed

- `docker/compose.devcontainer.yaml` mounts the host socket into the API container.
- The API invokes `docker compose` inside the container; commands reach the host daemon via the mounted socket.
- Without sufficient socket permissions, you will see errors like:
  `permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock`

## Verify inside the devcontainer

```bash
docker compose version
docker info
```

You should see a Compose version and the host containers listed.

## Reverting the change (optional)

To restore default permissions on the host (e.g., after the session):

```bash
sudo chmod 660 /var/run/docker.sock
```


