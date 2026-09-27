# OS Guardian

OS Guardian is a native Linux command-line utility for viewing host resource status and inspecting processes. This repository also contains a systemd service mode and a separate web dashboard. The portable ZIP contains only the native CLI and service files.

## Current capabilities and limits

- `status` reads live host CPU, memory, load, and process information.
- `processes` lists processes visible through `/proc`; `inspect PID` shows details for one process.
- `impact PID` calculates and prints a heuristic impact assessment. It does not apply the suggested action.
- `policy` prints policy information, but the current CLI does not enforce automatic remediation.
- `tree` currently prints the process list; it does not render a process hierarchy.
- `events` currently reports no events. The daemon periodically samples telemetry and prints a warning for processes using more than 400 MB; it does not persist events or automatically remediate processes.

Run process inspection as root only when you need visibility into details restricted from your normal user. Review `impact` output before taking any action yourself.

## Requirements

- Kali Linux or another Linux distribution on 64-bit x86 (`x86_64` / Debian `amd64`).
- The CLI reads Linux `/proc` and `/sys` data. systemd is required only for managing the optional service.
- Building from source requires `g++` with C++20 support, `make`, and Python 3.

Check the machine architecture with `uname -m`; the supplied ZIP is for `x86_64`.

## Build the portable ZIP

On Kali, from the extracted project source directory:

```bash
sudo apt update
sudo apt install -y build-essential python3
make package
```

The output is `packaging/dist/osguardian.zip`. It contains the CLI, daemon executable, configuration, service unit, installer, and a README. Copy that ZIP to the Kali machine where you want to use OS Guardian.

## Extract and run

From the directory containing the ZIP:

```bash
unzip osguardian.zip
cd osguardian-linux-amd64
./osguardian --help
./osguardian status
```

Other available commands:

```bash
./osguardian processes
./osguardian inspect 1
./osguardian impact 1
./osguardian policy
./osguardian events
./osguardian status --json
./osguardian processes --json
```

The program can be run directly from the extracted folder; system-wide installation is optional.

## Install the command system-wide

From inside `osguardian-linux-amd64`:

```bash
sudo bash install.sh
osguardian --help
osguardian status
```

The installer places the CLI at `/usr/bin/osguardian`, the daemon at `/usr/sbin/osguardiand`, and configuration and service files under `/etc/osguardian` and `/lib/systemd/system`.

## Run the background service

The service is not enabled automatically. Start it and enable it at boot with:

```bash
sudo systemctl enable --now osguardiand
systemctl status osguardiand
journalctl -u osguardiand -f
```

Stop it with `sudo systemctl disable --now osguardiand`. The daemon prints a telemetry summary every two seconds and reports processes above its fixed 400 MB warning threshold.

## Uninstall a ZIP installation

```bash
sudo systemctl disable --now osguardiand 2>/dev/null || true
sudo rm -f /usr/bin/osguardian /usr/sbin/osguardiand
sudo rm -f /lib/systemd/system/osguardiand.service /etc/osguardian/osguardian.conf
sudo systemctl daemon-reload
```

This leaves log and state directories, if present.

## Optional Debian package

To build a `.deb` from source, install `dpkg-dev` and run:

```bash
sudo apt install -y dpkg-dev
make package-deb
sudo apt install ./packaging/dist/osguardian.deb
```

## Web dashboard

The web dashboard is not included in the portable ZIP or Debian package. It is a separate Node.js application.

## Deploy to Render

The repository includes a Docker-based Render Blueprint in `render.yaml`. Push the project to a Git repository, create a new Blueprint in Render, and select that repository. The Docker build installs native build tools, compiles the Linux executable and distribution artifacts, builds the Vite UI/server bundle, and starts the production server. The server listens on Render's injected `PORT`.

Render hosts the dashboard and APIs inside a container; the native collector sees the container environment, not the underlying Render host, and systemd is not run inside the container. Production allows only supported `osguardian` commands through the terminal API; arbitrary shell input is rejected. Demo fault injection and remediation endpoints are disabled in production. The public API still has no user authentication, so add an authentication/access-control layer before using it for sensitive data or actions.