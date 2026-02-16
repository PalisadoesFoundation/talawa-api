#!/usr/bin/env bash
set -euo pipefail

MODE="auto"
RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/${UID}}"
ROOTFUL_SOCKET="/var/run/docker.sock"
EMIT_EXPORT="false"
WARN_DOCKER_GROUP="false"

usage() {
	cat <<'EOF'
Usage: resolve-docker-host.sh [options]

Options:
  --mode <auto|rootless|rootful>  Docker host resolution mode (default: auto)
  --runtime-dir <path>            Runtime dir used for rootless socket
  --rootful-socket <path>         Rootful socket path (default: /var/run/docker.sock)
  --emit-export                   Print `export DOCKER_HOST=...` instead of raw value
  --warn-if-docker-group          Emit warning when running rootless while in docker group
  --help                          Show this message
EOF
}

require_flag_value() {
	local flag="$1"
	local value="${2-}"

	if [[ -z "$value" || "$value" == --* ]]; then
		echo "Missing value for ${flag}" >&2
		exit 1
	fi
}

socket_exists() {
	local socket_path="$1"
	# Production resolution should only accept Unix sockets.
	# Tests can opt in to regular-file simulation via TEST_HARNESS_ALLOW_REGULAR_SOCKET_PATHS=true.
	if [[ "${TEST_HARNESS_ALLOW_REGULAR_SOCKET_PATHS:-false}" == "true" ]]; then
		[[ -S "$socket_path" || -e "$socket_path" ]]
		return
	fi
	[[ -S "$socket_path" ]]
}

while [[ $# -gt 0 ]]; do
	case "$1" in
	--mode)
		require_flag_value "$1" "${2-}"
		MODE="$2"
		shift 2
		;;
	--runtime-dir)
		require_flag_value "$1" "${2-}"
		RUNTIME_DIR="$2"
		shift 2
		;;
	--rootful-socket)
		require_flag_value "$1" "${2-}"
		ROOTFUL_SOCKET="$2"
		shift 2
		;;
	--emit-export)
		EMIT_EXPORT="true"
		shift
		;;
	--warn-if-docker-group)
		WARN_DOCKER_GROUP="true"
		shift
		;;
	--help | -h)
		usage
		exit 0
		;;
	*)
		echo "Unknown option: $1" >&2
		usage >&2
		exit 1
		;;
	esac
done

if [[ "$MODE" != "auto" && "$MODE" != "rootless" && "$MODE" != "rootful" ]]; then
	echo "Invalid mode: $MODE" >&2
	exit 1
fi

rootless_socket="${RUNTIME_DIR%/}/docker.sock"

# In explicit rootless mode, we intentionally allow exporting DOCKER_HOST before
# daemon startup. Callers should perform readiness checks (for example `docker info`)
# after resolving `resolved` from `rootless_socket`.
if [[ "$MODE" == "rootless" ]]; then
	resolved="unix://${rootless_socket}"
elif [[ "$MODE" == "rootful" ]]; then
	if ! socket_exists "$ROOTFUL_SOCKET"; then
		echo "Rootful socket not found: ${ROOTFUL_SOCKET}" >&2
		exit 1
	fi
	resolved="unix://${ROOTFUL_SOCKET}"
else
	if socket_exists "$rootless_socket"; then
		resolved="unix://${rootless_socket}"
	elif socket_exists "$ROOTFUL_SOCKET"; then
		resolved="unix://${ROOTFUL_SOCKET}"
	else
		echo "No Docker socket found (checked: ${rootless_socket}, ${ROOTFUL_SOCKET})" >&2
		exit 1
	fi
fi

if [[ "$WARN_DOCKER_GROUP" == "true" && "$resolved" == "unix://${rootless_socket}" ]]; then
	if id -nG | tr ' ' '\n' | grep -qx docker; then
		echo "Warning: current user is in docker group while rootless mode is selected." >&2
	fi
fi

if [[ "$EMIT_EXPORT" == "true" ]]; then
	printf 'export DOCKER_HOST=%q\n' "$resolved"
else
	printf '%s\n' "$resolved"
fi

