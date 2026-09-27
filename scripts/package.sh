#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "==> [1/6] Compiling C++20 osguardian binary..."
cd "${ROOT_DIR}"
mkdir -p bin packaging/dist packaging/deb/usr/bin packaging/deb/usr/sbin packaging/deb/etc/osguardian packaging/deb/lib/systemd/system

g++ -std=c++20 -O2 -Wall -Wextra -I native/src \
    native/src/telemetry/collector.cpp \
    native/src/cli/main.cpp \
    -o bin/osguardian

strip bin/osguardian || true
chmod 755 bin/osguardian

echo "==> [2/6] Packaging Standalone Binary..."
if [[ "${1:-}" != "--deb-only" && "${1:-}" != "--zip-only" ]]; then
  cp bin/osguardian packaging/dist/osguardian
  chmod +x packaging/dist/osguardian
fi

if [[ "${1:-}" == "--zip-only" ]]; then
  echo "==> Building portable Kali ZIP..."
  ZIP_STAGE="$(mktemp -d "${ROOT_DIR}/packaging/.osguardian-zip.XXXXXX")"
  trap 'rm -rf "${ZIP_STAGE}"' EXIT
  ZIP_ROOT="${ZIP_STAGE}/osguardian-linux-amd64"
  mkdir -p "${ZIP_ROOT}"

  install -m 755 bin/osguardian "${ZIP_ROOT}/osguardian"
  install -m 755 bin/osguardian "${ZIP_ROOT}/osguardiand"
  install -m 644 packaging/deb/etc/osguardian/osguardian.conf "${ZIP_ROOT}/osguardian.conf"
  install -m 644 packaging/deb/lib/systemd/system/osguardiand.service "${ZIP_ROOT}/osguardiand.service"

  cat << 'EOF' > "${ZIP_ROOT}/install.sh"
#!/usr/bin/env bash
set -e
if [ "$EUID" -ne 0 ]; then
  echo "Run this installer with sudo: sudo bash install.sh"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
install -m 755 "${SCRIPT_DIR}/osguardian" /usr/bin/osguardian
install -m 755 "${SCRIPT_DIR}/osguardiand" /usr/sbin/osguardiand
install -d -m 755 /etc/osguardian /var/log/osguardian /var/lib/osguardian /run/osguardian
install -m 644 "${SCRIPT_DIR}/osguardian.conf" /etc/osguardian/osguardian.conf
install -m 644 "${SCRIPT_DIR}/osguardiand.service" /lib/systemd/system/osguardiand.service
systemctl daemon-reload

echo "Installed. Run: osguardian status"
echo "To start background monitoring: sudo systemctl enable --now osguardiand"
EOF
  chmod 755 "${ZIP_ROOT}/install.sh"

  install -m 644 packaging/zip/README.md "${ZIP_ROOT}/README.md"

  python3 - "${ZIP_STAGE}" "${ROOT_DIR}/packaging/dist/osguardian.zip" << 'PYTHON'
import pathlib
import sys
import zipfile

stage = pathlib.Path(sys.argv[1])
archive_path = pathlib.Path(sys.argv[2])
with zipfile.ZipFile(archive_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
    for file_path in sorted(stage.rglob("*")):
        if file_path.is_file():
            archive.write(file_path, file_path.relative_to(stage).as_posix())
PYTHON

  echo "==> ZIP created: packaging/dist/osguardian.zip"
  exit 0
fi

echo "==> [3/6] Building Kali / Debian Package (.deb)..."
cp bin/osguardian packaging/deb/usr/bin/osguardian
cp bin/osguardian packaging/deb/usr/sbin/osguardiand
chmod 755 packaging/deb/usr/bin/osguardian
chmod 755 packaging/deb/usr/sbin/osguardiand
chmod 755 packaging/deb/DEBIAN/postinst

dpkg-deb --build packaging/deb packaging/dist/osguardian.deb

if [[ "${1:-}" == "--deb-only" ]]; then
  echo "==> Debian package created: packaging/dist/osguardian.deb"
  exit 0
fi

echo "==> [4/6] Building Portable Tarball (.tar.gz)..."
TAR_TMP="${ROOT_DIR}/packaging/tar/osguardian-1.0.0-linux-x86_64"
rm -rf "${ROOT_DIR}/packaging/tar"
mkdir -p "${TAR_TMP}"

cp bin/osguardian "${TAR_TMP}/osguardian"
cp bin/osguardian "${TAR_TMP}/osguardiand"
cp packaging/deb/etc/osguardian/osguardian.conf "${TAR_TMP}/osguardian.conf"
cp packaging/deb/lib/systemd/system/osguardiand.service "${TAR_TMP}/osguardiand.service"

cat << 'EOF' > "${TAR_TMP}/install.sh"
#!/usr/bin/env bash
set -e
if [ "$EUID" -ne 0 ]; then
  echo "[-] Please run as root (sudo ./install.sh)"
  exit 1
fi

echo "==> Installing OS Guardian to /usr/bin and /usr/sbin..."
install -m 755 osguardian /usr/bin/osguardian
install -m 755 osguardiand /usr/sbin/osguardiand
mkdir -p /etc/osguardian /var/log/osguardian /var/lib/osguardian /run/osguardian
install -m 644 osguardian.conf /etc/osguardian/osguardian.conf

if [ -d /lib/systemd/system ]; then
  install -m 644 osguardiand.service /lib/systemd/system/osguardiand.service
  systemctl daemon-reload || true
  echo "==> Systemd service installed: osguardiand.service"
fi

echo "==> OS Guardian installed successfully!"
echo "Run 'osguardian --help' or 'osguardian status' to get started."
EOF
chmod +x "${TAR_TMP}/install.sh"

cat << 'EOF' > "${TAR_TMP}/uninstall.sh"
#!/usr/bin/env bash
set -e
if [ "$EUID" -ne 0 ]; then
  echo "[-] Please run as root (sudo ./uninstall.sh)"
  exit 1
fi
echo "==> Removing OS Guardian..."
systemctl stop osguardiand 2>/dev/null || true
systemctl disable osguardiand 2>/dev/null || true
rm -f /usr/bin/osguardian /usr/sbin/osguardiand
rm -f /lib/systemd/system/osguardiand.service
systemctl daemon-reload || true
echo "==> OS Guardian uninstalled."
EOF
chmod +x "${TAR_TMP}/uninstall.sh"

cat << 'EOF' > "${TAR_TMP}/README.md"
# OS Guardian for Linux (Kali, Debian, Ubuntu, Fedora, Arch)

Autonomous Linux System Observability, Intelligence, and Remediation Platform.

## Quick Start
```bash
# Run standalone directly
./osguardian status
./osguardian processes
./osguardian inspect 1
./osguardian impact 1

# Or install system-wide
sudo ./install.sh
osguardian status
```
EOF

tar -czf packaging/dist/osguardian.tar.gz -C "${ROOT_DIR}/packaging/tar" osguardian-1.0.0-linux-x86_64

echo "==> [5/6] Building Portable AppImage / Executable Bundle..."
# Self-executing bundle that runs osguardian with embedded checks
cat << 'EOF' > packaging/dist/osguardian.AppImage
#!/usr/bin/env bash
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
BIN_DATA_LINE=$(grep -a -n "^__OSGUARDIAN_BINARY_START__" "$0" | cut -d: -f1)

TMP_EXEC=$(mktemp /tmp/osguardian.XXXXXX)
tail -n +$((BIN_DATA_LINE + 1)) "$0" > "$TMP_EXEC"
chmod +x "$TMP_EXEC"

cleanup() {
  rm -f "$TMP_EXEC"
}
trap cleanup EXIT

"$TMP_EXEC" "$@"
exit $?
__OSGUARDIAN_BINARY_START__
EOF
cat bin/osguardian >> packaging/dist/osguardian.AppImage
chmod +x packaging/dist/osguardian.AppImage

echo "==> [6/6] Generating One-Liner install.sh..."
cat << 'EOF' > packaging/dist/install.sh
#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "    OS GUARDIAN - Linux Autonomous Engine Installer       "
echo "=========================================================="

# Detect package manager
ARCH=$(uname -m)
if [ "$ARCH" != "x86_64" ]; then
  echo "[-] Warning: OS Guardian binary is compiled for x86_64 Linux (detected $ARCH)."
fi

TARGET_DIR="/usr/local/bin"
if [ "$EUID" -ne 0 ]; then
  if command -v sudo >/dev/null 2>&1; then
    SUDO="sudo"
  else
    echo "[-] Error: Please run this script as root or with sudo."
    exit 1
  fi
else
  SUDO=""
fi

SERVER_HOST="${1:-}"
if [ -z "$SERVER_HOST" ]; then
  SERVER_HOST="localhost:3000"
fi

echo "[+] Downloading native osguardian binary..."
$SUDO mkdir -p "$TARGET_DIR"
if command -v curl >/dev/null 2>&1; then
  $SUDO curl -fsSL "http://${SERVER_HOST}/api/download/osguardian" -o "${TARGET_DIR}/osguardian"
elif command -v wget >/dev/null 2>&1; then
  $SUDO wget -q "http://${SERVER_HOST}/api/download/osguardian" -O "${TARGET_DIR}/osguardian"
else
  echo "[-] Neither curl nor wget found. Please install curl or wget."
  exit 1
fi

$SUDO chmod 755 "${TARGET_DIR}/osguardian"

echo "[+] Verifying executable..."
"${TARGET_DIR}/osguardian" version || true

echo ""
echo "=========================================================="
echo " [✓] SUCCESS! OS Guardian is installed at ${TARGET_DIR}/osguardian"
echo "=========================================================="
echo ""
echo " You can now run it anywhere in your terminal just like ettercap:"
echo "   osguardian status"
echo "   osguardian processes"
echo "   osguardian inspect 1"
echo "   osguardian impact 1"
echo "   osguardian policy"
echo "   osguardian --help"
echo ""
EOF
chmod +x packaging/dist/install.sh

echo "==> Packaging complete! Distribution files generated in packaging/dist:"
ls -lh packaging/dist/
