#!/usr/bin/env bash

##############################################################################
# Talawa - Shared Package Manager Library
#
# Supports:
#   - apt (Debian/Ubuntu)
#   - dnf / yum (RedHat family)
#   - pacman (Arch/Manjaro)
#   - brew (macOS)
#
# Depends on:
#   - os-detection.sh
#   - logging.sh
#   - validation.sh
##############################################################################

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# shellcheck disable=SC1091
. "${SCRIPT_DIR}/os-detection.sh"
# shellcheck disable=SC1091
. "${SCRIPT_DIR}/logging.sh"
# shellcheck disable=SC1091
. "${SCRIPT_DIR}/validation.sh"

##############################################################################
# Internal Helpers
##############################################################################

_require_package_name() {
    local pkg="${1:-}"
    if [ -z "${pkg}" ]; then
        error "Package name is required"
        return 2
    fi
    return 0
}

# Return codes:
#   0 -> sudo required and available
#   1 -> already root (no sudo needed)
#   2 -> not root and sudo unavailable (fatal)
_use_sudo() {
    if [ "$(id -u)" -eq 0 ]; then
        return 1
    fi

    if command_exists sudo; then
        return 0
    fi

    return 2
}

_run_privileged() {
    local sudo_status=0

    # Safe under set -e: capture non-zero without aborting
    _use_sudo || sudo_status=$?

    case "${sudo_status}" in
        0)
            run_cmd sudo "$@"
            ;;
        1)
            run_cmd "$@"
            ;;
        2)
            error "Root privileges required but sudo is not available"
            return 1
            ;;
        *)
            error "Unexpected privilege escalation state"
            return 1
            ;;
    esac

    return $?
}

_pm_cmd() {
    local family
    family="$(detect_distro_family)"

    case "${family}" in
        debian)
            echo "apt"
            ;;
        redhat)
            if command_exists dnf; then
                echo "dnf"
            elif command_exists yum; then
                echo "yum"
            else
                echo "unknown"
            fi
            ;;
        arch)
            echo "pacman"
            ;;
        macos)
            echo "brew"
            ;;
        *)
            echo "unknown"
            ;;
    esac
}

##############################################################################
# Public API
##############################################################################

get_package_manager() {
    _pm_cmd
}

update_package_index() {
    local pm status=0
    pm="$(_pm_cmd)"

    if [ "${pm}" = "unknown" ]; then
        error "Unsupported package manager"
        return 2
    fi

    info "Updating package index using ${pm}..."

    case "${pm}" in
        apt)
            _run_privileged apt-get update -y
            status=$?
            ;;
        dnf)
            _run_privileged dnf makecache -y
            status=$?
            ;;
        yum)
            _run_privileged yum makecache -y
            status=$?
            ;;
        pacman)
            _run_privileged pacman -Sy --noconfirm
            status=$?
            ;;
        brew)
            run_cmd brew update
            status=$?
            ;;
        *)
            error "Unsupported package manager: ${pm}"
            return 2
            ;;
    esac

    if [ "${status}" -ne 0 ]; then
        error "Failed to update package index using ${pm}"
        return "${status}"
    fi

    success "Package index updated"
    return 0
}

# Return codes:
#   0 -> installed
#   1 -> not installed
#   2 -> check failure / unknown PM
is_package_installed() {
    local pkg="${1:-}"
    _require_package_name "${pkg}" || return 2

    local pm
    pm="$(_pm_cmd)"

    case "${pm}" in
        apt)
            dpkg-query -W -f='${db:Status-Status}' "${pkg}" 2>/dev/null | grep -q '^installed$'
            return $?
            ;;
        dnf|yum)
            rpm -q "${pkg}" >/dev/null 2>&1
            return $?
            ;;
        pacman)
            pacman -Q "${pkg}" >/dev/null 2>&1
            return $?
            ;;
        brew)
            brew list --versions "${pkg}" >/dev/null 2>&1
            return $?
            ;;
        *)
            error "Unknown package manager: ${pm}"
            return 2
            ;;
    esac
}

install_package() {
    local pkg="${1:-}"
    _require_package_name "${pkg}" || return 2

    local pm status=0
    pm="$(_pm_cmd)"

    if [ "${pm}" = "unknown" ]; then
        error "Unsupported package manager"
        return 2
    fi

    # Distinguish installed / not installed / check failure
    is_package_installed "${pkg}"
    status=$?

    if [ "${status}" -eq 0 ]; then
        success "${pkg} is already installed"
        return 0
    elif [ "${status}" -gt 1 ]; then
        error "Failed to verify installation status for ${pkg}"
        return "${status}"
    fi
    # status == 1 -> not installed, proceed

    info "Installing ${pkg} using ${pm}..."

    case "${pm}" in
        apt)
            _run_privileged apt-get install -y "${pkg}"
            status=$?
            ;;
        dnf)
            _run_privileged dnf install -y "${pkg}"
            status=$?
            ;;
        yum)
            _run_privileged yum install -y "${pkg}"
            status=$?
            ;;
        pacman)
            _run_privileged pacman -S --noconfirm "${pkg}"
            status=$?
            ;;
        brew)
            run_cmd brew install "${pkg}"
            status=$?
            ;;
        *)
            error "Unsupported package manager: ${pm}"
            return 2
            ;;
    esac

    if [ "${status}" -ne 0 ]; then
        error "Failed to install ${pkg}"
        return "${status}"
    fi

    success "${pkg} installed successfully"
    return 0
}
