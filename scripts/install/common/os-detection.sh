#!/usr/bin/env bash
set -euo pipefail

# Minimal, robust OS / distro detection helper functions.
# Exports only the functions; no side effects when sourced.
# Functions:
#   detect_os             -> linux|macos|windows|unknown
#   detect_distro         -> ubuntu|debian|fedora|rhel|centos|arch|manjaro|unknown
#   detect_distro_family  -> debian|redhat|arch|macos|unknown
#   is_wsl                -> returns 0 if WSL detected (use as conditional)
#   get_os_version        -> version string or "unknown"
#   command_exists        -> check if command exists (silently)

_lower() { printf '%s' "${1:-}" | tr '[:upper:]' '[:lower:]'; }

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

detect_os() {
  local uname_s
  uname_s="$(uname -s 2>/dev/null || echo unknown)"
  case "$uname_s" in
    Linux*)  echo "linux" ;;
    Darwin*) echo "macos"  ;;
    CYGWIN*|MINGW*|MSYS*|Windows*) echo "windows" ;;
    *) echo "unknown" ;;
  esac
}

# Return canonical distro name from a Linux system.
detect_distro() {
  local os
  os="$(detect_os)"
  if [ "$os" != "linux" ]; then
    echo "unknown"
    return 0
  fi

  # Prefer /etc/os-release if present
  if [ -r /etc/os-release ]; then
    # shellcheck disable=SC1091
    . /etc/os-release || true
    local id_lc id_like_lc candidate
    id_lc="$(_lower "${ID:-}")"
    id_like_lc="$(_lower "${ID_LIKE:-}")"

    # Normalize some common IDs
    case "$id_lc" in
      ubuntu|debian|fedora|rhel|centos|arch|manjaro) echo "$id_lc"; return 0 ;;
    esac

    # If ID not in list, check ID_LIKE for family affiliated distributions
    # Map common derivatives to nearest canonical ID
    if printf '%s\n' "$id_like_lc" | grep -q 'debian'; then
      # Many derivatives (linuxmint, pop) are Debian/Ubuntu family
      # Choose ubuntu if ID explicitly mentions ubuntu, else debian if unknown
      if printf '%s\n' "$id_lc" | grep -q 'ubuntu'; then
        echo "ubuntu"
      else
        # default to debian for ID_LIKE=debian unless the ID text indicates ubuntu
        echo "debian"
      fi
      return 0
    fi

     if printf '%s\n' "$id_like_lc" | grep -qE 'rhel|fedora|centos'; then
      # prefer rhel for RHEL-family
      if printf '%s\n' "$id_lc" | grep -q 'fedora'; then
        echo "fedora"
      elif printf '%s\n' "$id_lc" | grep -q 'centos'; then
        echo "centos"
      else
        echo "rhel"
      fi
      return 0
    fi

    if printf '%s\n' "$id_like_lc" | grep -q 'arch'; then
      if [ "$id_lc" = "manjaro" ]; then
        echo "manjaro"
      else
        echo "arch"
      fi
      return 0
    fi

    # Some distributions set PRETTY_NAME or NAME only; try to derive common names
    candidate="$(_lower "${NAME:-}")"
    case "$candidate" in
      *ubuntu*) echo "ubuntu" ; return 0 ;;
      *debian*) echo "debian" ; return 0 ;;
      *fedora*) echo "fedora" ; return 0 ;;
      *centos*) echo "centos" ; return 0 ;;
      *red\ hat*|*rhel*) echo "rhel" ; return 0 ;;
      *arch*linux*) echo "arch" ; return 0 ;;
      *manjaro*) echo "manjaro" ; return 0 ;;
    esac
  fi

  # Fallbacks: lsb_release, /etc/*-release files
  if command -v lsb_release >/dev/null 2>&1; then
    local lbl
    lbl="$(_lower "$(lsb_release -si 2>/dev/null || echo "")")"
    case "$lbl" in
      ubuntu|debian|fedora|centos|arch|manjaro) echo "$lbl"; return 0 ;;
    esac
  fi

  # As last resort, try to parse /etc/*release-like files
  if [ -r /etc/lsb-release ]; then
    # shellcheck disable=SC1091
    . /etc/lsb-release 2>/dev/null || true
    local distro_from_lsb
    distro_from_lsb="$(_lower "${DISTRIB_ID:-}")"
    case "$distro_from_lsb" in
      ubuntu|debian) echo "$distro_from_lsb"; return 0 ;;
    esac
  fi

  echo "unknown"
}

# Map distro to distro family
detect_distro_family() {
  local d
  d="$(detect_distro)"
  case "$d" in
    ubuntu|debian) echo "debian" ;;
    fedora|rhel|centos) echo "redhat" ;;
    arch|manjaro) echo "arch" ;;
    *) 
      # If not recognized but running macOS
      if [ "$(detect_os)" = "macos" ]; then
        echo "macos"
      else
        echo "unknown"
      fi
      ;;
  esac
}

# Return 0 (success) if running under Windows Subsystem for Linux.
is_wsl() {
  # /proc/version contains "Microsoft" on many WSL kernels
  if [ -r /proc/version ] && grep -qi 'microsoft' /proc/version 2>/dev/null; then
    return 0
  fi

  # Newer kernels may have "microsoft-standard" in osrelease or uname -r
  if [ -r /proc/sys/kernel/osrelease ] && grep -qi 'microsoft' /proc/sys/kernel/osrelease 2>/dev/null; then
    return 0
  fi

  # WSL sets WSL_DISTRO_NAME env var for many distros
  if [ -n "${WSL_DISTRO_NAME:-}" ]; then
    return 0
  fi

  return 1
}

# Return an OS version string.
# For linux: uses VERSION_ID from /etc/os-release when available, else kernel release.
# For macos: uses sw_vers -productVersion.
# For windows (MSYS/CYGWIN): tries 'cmd.exe /c ver' fallback; otherwise "unknown".
get_os_version() {
  local os
  os="$(detect_os)"
  case "$os" in
    macos)
      sw_vers -productVersion 2>/dev/null || echo "unknown"
      ;;
    linux)
      if [ -r /etc/os-release ]; then
        # shellcheck disable=SC1091
        . /etc/os-release 2>/dev/null || true
        if [ -n "${VERSION_ID:-}" ]; then
          echo "${VERSION_ID}"
          return 0
        fi
      fi
      # Fallback to kernel release
      uname -r 2>/dev/null || echo "unknown"
      ;;
    windows)
        # Running under MSYS/MINGW — try to query cmd.exe ver and sanitize output
      if command -v cmd.exe >/dev/null 2>&1; then
        # cmd.exe outputs something like: "Microsoft Windows [Version 10.0.19041.1165]"
        local win_ver
        win_ver="$(cmd.exe /c ver 2>/dev/null | tr -d '\r' | sed -n '1p')" || true
        echo "${win_ver:-unknown}"
      else
        echo "unknown"
      fi
      ;;
    *)
      echo "unknown"
      ;;
  esac
}

# If executed directly, print a concise single-line summary.
if [ "${BASH_SOURCE[0]}" = "$0" ]; then
  OS="$(detect_os)"
  DIST="$(detect_distro)"
  FAMILY="$(detect_distro_family)"
  WSL_DETECTED=1
  if is_wsl; then WSL_DETECTED=0; fi

  printf 'OS=%s\nDISTRO=%s\nFAMILY=%s\nWSL=%s\nVERSION=%s\n' \
    "$OS" "$DIST" "$FAMILY" "$([ "$WSL_DETECTED" -eq 0 ] && printf 'true' || printf 'false')" \
    "$(get_os_version)"
fi
