# OS Guardian for Kali Linux (amd64)

OS Guardian reads Linux host telemetry and process information. This ZIP contains the native CLI, daemon executable, configuration, systemd service, and installer. It does not include the web dashboard.

## Run from this folder

```bash
./osguardian --help
./osguardian status
./osguardian processes
./osguardian inspect 1
./osguardian impact 1
./osguardian policy
./osguardian status --json
```

`impact` displays an assessment; it does not take action. The current daemon reports basic telemetry and high-memory warnings; it does not automatically remediate processes. `tree` currently prints the process list, and `events` is a placeholder.

## Install system-wide

```bash
sudo bash install.sh
osguardian status
```

## Optional background monitor

```bash
sudo systemctl enable --now osguardiand
systemctl status osguardiand
journalctl -u osguardiand -f
```

The service requires systemd and is not enabled automatically. The supplied executable targets 64-bit x86 Linux (`x86_64`).