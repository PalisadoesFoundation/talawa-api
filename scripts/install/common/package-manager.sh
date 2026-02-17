#!/usr/bin/env bash
set -euo pipefail

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
#   - validation.sh (for run_cmd + helpers)
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
        return 1
    fi
    return 0
}

_use_sudo() {
    if [ "$(id -u)" -ne 0 ]; then
        if command_exists sudo; then
            return 0
        fi
        error "Root privileges required but sudo is not available"
        return 1
    fi
    return 1
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
    local pm
    pm="$(_pm_cmd)"

    if [ "${pm}" = "unknown" ]; then
        error "Unsupported package manager"
        return 1
    fi

    info "Updating package index using ${pm}..."

    case "${pm}" in
        apt)
            if _use_sudo; then
                run_cmd sudo apt-get update -y
            else
                run_cmd apt-get update -y
            fi
            ;;
        dnf)
            if _use_sudo; then
                run_cmd sudo dnf makecache -y
            else
                run_cmd dnf makecache -y
            fi
            ;;
        yum)
            if _use_sudo; then
                run_cmd sudo yum makecache -y
            else
                run_cmd yum makecache -y
            fi
            ;;
        pacman)
            if _use_sudo; then
                run_cmd sudo pacman -Sy --noconfirm
            else
                run_cmd pacman -Sy --noconfirm
            fi
            ;;
        brew)
            run_cmd brew update
            ;;
        *)
            error "Unsupported package manager: ${pm}"
            return 1
            ;;
    esac

    success "Package index updated"
    return 0
}

is_package_installed() {
    local pkg="${1:-}"
    _require_package_name "${pkg}" || return 1

    local pm
    pm="$(_pm_cmd)"

    case "${pm}" in
        apt)
            dpkg -s "${pkg}" >/dev/null 2>&1
            ;;
        dnf|yum)
            rpm -q "${pkg}" >/dev/null 2>&1
            ;;
        pacman)
            pacman -Q "${pkg}" >/dev/null 2>&1
            ;;
        brew)
            brew list --versions "${pkg}" >/dev/null 2>&1
            ;;
        *)
            return 1
            ;;
    esac
}

install_package() {
    local pkg="${1:-}"
    _require_package_name "${pkg}" || return 1

    local pm
    pm="$(_pm_cmd)"

    if [ "${pm}" = "unknown" ]; then
        error "Unsupported package manager"
        return 1
    fi

    if is_package_installed "${pkg}"; then
        success "${pkg} is already installed"
        return 0
    fi

    info "Installing ${pkg} using ${pm}..."

    case "${pm}" in
        apt)
            if _use_sudo; then
                run_cmd sudo apt-get install -y "${pkg}"
            else
                run_cmd apt-get install -y "${pkg}"
            fi
            ;;
        dnf)
            if _use_sudo; then
                run_cmd sudo dnf install -y "${pkg}"
            else
                run_cmd dnf install -y "${pkg}"
            fi
            ;;
        yum)
            if _use_sudo; then
                run_cmd sudo yum install -y "${pkg}"
            else
                run_cmd yum install -y "${pkg}"
            fi
            ;;
        pacman)
            if _use_sudo; then
                run_cmd sudo pacman -S --noconfirm "${pkg}"
            else
                run_cmd pacman -S --noconfirm "${pkg}"
            fi
            ;;
        brew)
            run_cmd brew install "${pkg}"
            ;;
        *)
            error "Unsupported package manager: ${pm}"
            return 1
            ;;
    esac

    success "${pkg} installed successfully"
    return 0
}
