import React, { useState } from "react";
import { 
  Download, 
  X, 
  Terminal, 
  Check, 
  Copy, 
  ShieldCheck, 
  Package,
  Layers,
  HardDrive,
  CheckCircle2,
  FolderArchive,
  ArrowDownToLine,
  Zap,
  Info
} from "lucide-react";

interface BinaryDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "deb" | "binary" | "tar" | "appimage" | "architecture";
}

export const BinaryDownloadModal: React.FC<BinaryDownloadModalProps> = ({ 
  isOpen, 
  onClose,
  defaultTab = "deb"
}) => {
  const [activeTab, setActiveTab] = useState<"deb" | "binary" | "tar" | "appimage" | "architecture">(defaultTab);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const debDownloadUrl = `${currentOrigin}/api/download/osguardian.deb`;
  const binDownloadUrl = `${currentOrigin}/api/download/osguardian`;
  const tarDownloadUrl = `${currentOrigin}/api/download/osguardian.tar.gz`;
  const appImageDownloadUrl = `${currentOrigin}/api/download/osguardian.AppImage`;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const kaliCommands = `# 1. Download .deb package
wget ${debDownloadUrl} -O osguardian.deb

# 2. Install on Kali Linux / Debian
sudo dpkg -i osguardian.deb || sudo apt install -f -y ./osguardian.deb

# 3. Run directly anywhere (like ettercap, nmap, htop)
osguardian status`;

  const binaryCommands = `# 1. Download standalone binary
curl -fsSL ${binDownloadUrl} -o osguardian

# 2. Grant execution permission & move to system PATH
chmod +x osguardian
sudo mv osguardian /usr/local/bin/

# 3. Run anywhere in your terminal
osguardian status`;

  const tarCommands = `# 1. Download & extract tarball
wget ${tarDownloadUrl}
tar -xzf osguardian.tar.gz
cd osguardian-1.0.0-linux-x86_64

# 2. Run standalone installer (sets up systemd daemon)
sudo ./install.sh

# 3. Check status
osguardian status`;

  const appImageCommands = `# 1. Download AppImage bundle
curl -fsSL ${appImageDownloadUrl} -o osguardian.AppImage

# 2. Make executable & execute directly
chmod +x osguardian.AppImage
./osguardian.AppImage status`;

  const commandsList = [
    { cmd: "osguardian status", desc: "Live host CPU, memory, 1m/5m/15m load & top active tasks" },
    { cmd: "osguardian processes", desc: "List all active processes sampled directly from /proc" },
    { cmd: "osguardian inspect <PID>", desc: "Deep telemetry on PID (state, threads, cgroup, memory)" },
    { cmd: "osguardian impact <PID>", desc: "Autonomous blast-radius simulation & safest action matrix" },
    { cmd: "osguardian policy", desc: "Display active protection policies and safety bounds" },
    { cmd: "osguardian daemon", desc: "Start background telemetry collector loop (osguardiand)" },
    { cmd: "osguardian status --json", desc: "Machine-readable JSON telemetry stream for automations" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/75 backdrop-blur-xs">
      <div 
        className="bg-white border border-zinc-300 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-950 text-white flex items-center justify-center shadow-xs">
              <Package className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-950">Install OS Guardian on Linux</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  v1.0.0 Native Engine
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Run natively on your real Linux machine (Kali, Debian, Ubuntu, Fedora, Arch) just like <code className="font-mono text-zinc-900 font-bold">ettercap</code>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/80 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-200 bg-zinc-100/70 px-6 gap-2 pt-2 text-xs font-mono overflow-x-auto">
          <button
            onClick={() => setActiveTab("deb")}
            className={`px-3 py-2 border-b-2 font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === "deb"
                ? "border-emerald-600 text-zinc-950 bg-white rounded-t-lg shadow-2xs"
                : "border-transparent text-zinc-600 hover:text-zinc-950"
            }`}
          >
            <Package className="w-3.5 h-3.5 text-emerald-600" />
            <span>Kali / Debian (.deb)</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full">Recommended</span>
          </button>

          <button
            onClick={() => setActiveTab("binary")}
            className={`px-3 py-2 border-b-2 font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === "binary"
                ? "border-emerald-600 text-zinc-950 bg-white rounded-t-lg shadow-2xs"
                : "border-transparent text-zinc-600 hover:text-zinc-950"
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-zinc-700" />
            <span>Standalone Binary</span>
          </button>

          <button
            onClick={() => setActiveTab("tar")}
            className={`px-3 py-2 border-b-2 font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === "tar"
                ? "border-emerald-600 text-zinc-950 bg-white rounded-t-lg shadow-2xs"
                : "border-transparent text-zinc-600 hover:text-zinc-950"
            }`}
          >
            <FolderArchive className="w-3.5 h-3.5 text-zinc-700" />
            <span>Tarball (.tar.gz)</span>
          </button>

          <button
            onClick={() => setActiveTab("appimage")}
            className={`px-3 py-2 border-b-2 font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === "appimage"
                ? "border-emerald-600 text-zinc-950 bg-white rounded-t-lg shadow-2xs"
                : "border-transparent text-zinc-600 hover:text-zinc-950"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-zinc-700" />
            <span>AppImage Bundle</span>
          </button>

          <button
            onClick={() => setActiveTab("architecture")}
            className={`px-3 py-2 border-b-2 font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === "architecture"
                ? "border-emerald-600 text-zinc-950 bg-white rounded-t-lg shadow-2xs"
                : "border-transparent text-zinc-600 hover:text-zinc-950"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-zinc-700" />
            <span>Architecture Flow</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs font-mono">
          
          {/* TAB 1: KALI LINUX / DEBIAN PACKAGE (.deb) */}
          {activeTab === "deb" && (
            <div className="space-y-4">
              {/* Download Callout Card */}
              <div className="p-4 rounded-xl bg-zinc-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-zinc-800 shadow-sm">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-white">osguardian_1.0.0_amd64.deb</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/80 font-bold">
                      43.3 KB
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-sans">
                    Debian / Kali Linux package. Installs system binaries <code className="text-white font-mono">/usr/bin/osguardian</code>, daemon <code className="text-white font-mono">/usr/sbin/osguardiand</code>, and systemd unit.
                  </p>
                </div>

                <a
                  id="modal-download-deb-btn"
                  href="/api/download/osguardian.deb"
                  download="osguardian_1.0.0_amd64.deb"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs font-mono transition flex items-center gap-2 shadow-sm whitespace-nowrap cursor-pointer"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  <span>Download .deb Package</span>
                </a>
              </div>

              {/* Instructions for Kali Linux */}
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 font-sans space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-zinc-900 text-xs">
                    <Terminal className="w-4 h-4 text-emerald-600" />
                    <span>How to use in Kali Linux (like ettercap, nmap, htop)</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(kaliCommands, 1)}
                    className="text-zinc-600 hover:text-zinc-950 font-mono text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedIndex === 1 ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedIndex === 1 ? "Copied All!" : "Copy Commands"}</span>
                  </button>
                </div>

                <pre className="p-3 rounded-lg bg-zinc-950 text-emerald-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {kaliCommands}
                </pre>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-zinc-600 font-sans pt-1">
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Adds <code className="font-mono text-zinc-900 font-bold">osguardian</code> to system PATH directly</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Configures systemd daemon <code className="font-mono text-zinc-900 font-bold">osguardiand.service</code></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STANDALONE BINARY */}
          {activeTab === "binary" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-zinc-800 shadow-sm">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-white">osguardian (x86_64 ELF)</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold">
                      121 KB
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-sans">
                    Single statically linked C++20 Linux binary. Zero external runtime dependencies.
                  </p>
                </div>

                <a
                  id="modal-download-bin-btn"
                  href="/api/download/osguardian"
                  download="osguardian"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs font-mono transition flex items-center gap-2 shadow-sm whitespace-nowrap cursor-pointer"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  <span>Download Binary</span>
                </a>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 font-sans space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-zinc-900 text-xs">
                    <Terminal className="w-4 h-4 text-zinc-800" />
                    <span>Quick Install to /usr/local/bin:</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(binaryCommands, 2)}
                    className="text-zinc-600 hover:text-zinc-950 font-mono text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedIndex === 2 ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedIndex === 2 ? "Copied!" : "Copy"}</span>
                  </button>
                </div>

                <pre className="p-3 rounded-lg bg-zinc-950 text-emerald-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {binaryCommands}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: TARBALL (.tar.gz) */}
          {activeTab === "tar" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-zinc-800 shadow-sm">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-white">osguardian-1.0.0-linux-x86_64.tar.gz</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold">
                      102 KB
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-sans">
                    Portable archive with binaries, install script, systemd unit, and config file.
                  </p>
                </div>

                <a
                  id="modal-download-tar-btn"
                  href="/api/download/osguardian.tar.gz"
                  download="osguardian-1.0.0-linux-x86_64.tar.gz"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs font-mono transition flex items-center gap-2 shadow-sm whitespace-nowrap cursor-pointer"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  <span>Download .tar.gz</span>
                </a>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 font-sans space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-zinc-900 text-xs">
                    <Terminal className="w-4 h-4 text-zinc-800" />
                    <span>Extract &amp; Install:</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(tarCommands, 3)}
                    className="text-zinc-600 hover:text-zinc-950 font-mono text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedIndex === 3 ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedIndex === 3 ? "Copied!" : "Copy"}</span>
                  </button>
                </div>

                <pre className="p-3 rounded-lg bg-zinc-950 text-emerald-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {tarCommands}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: APPIMAGE */}
          {activeTab === "appimage" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-zinc-800 shadow-sm">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-white">osguardian-1.0.0-x86_64.AppImage</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold">
                      121 KB
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-sans">
                    Single self-contained executable bundle. Runs on any Linux distribution without root installation.
                  </p>
                </div>

                <a
                  id="modal-download-appimage-btn"
                  href="/api/download/osguardian.AppImage"
                  download="osguardian-1.0.0-x86_64.AppImage"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs font-mono transition flex items-center gap-2 shadow-sm whitespace-nowrap cursor-pointer"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  <span>Download AppImage</span>
                </a>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 font-sans space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-zinc-900 text-xs">
                    <Terminal className="w-4 h-4 text-zinc-800" />
                    <span>Run AppImage directly:</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(appImageCommands, 4)}
                    className="text-zinc-600 hover:text-zinc-950 font-mono text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedIndex === 4 ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedIndex === 4 ? "Copied!" : "Copy"}</span>
                  </button>
                </div>

                <pre className="p-3 rounded-lg bg-zinc-950 text-emerald-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {appImageCommands}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 5: ARCHITECTURE PIPELINE */}
          {activeTab === "architecture" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-900 text-zinc-100 border border-zinc-800 space-y-3">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-sans">
                  Distribution &amp; Real Linux Execution Flow:
                </div>
                <pre className="text-[11px] font-mono leading-relaxed overflow-x-auto text-zinc-300 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
{`                    OS GUARDIAN WEBSITE
                         │
                         │ Download
                         ▼
              ┌──────────────────────┐
              │ Linux Package        │
              │ osguardian.deb       │
              │ osguardian.AppImage  │
              │ osguardian.tar.gz    │
              └──────────┬───────────┘
                         │
                     INSTALL
                         │
                         ▼
              ┌──────────────────────┐
              │ REAL LINUX MACHINE   │
              │                      │
              │  osguardiand         │
              │  /usr/bin/osguardian │
              │                      │
              └──────────┬───────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
       /proc            /sys          cgroups
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                TELEMETRY COLLECTOR
                         ▼
                  STATE ENGINE
                         ▼
              PROCESS INTELLIGENCE
                         ▼
                 RISK ENGINE
                         ▼
                IMPACT ANALYZER
                         ▼
                 POLICY ENGINE
                         ▼
              REMEDIATION ENGINE
                         ▼
                  VERIFICATION
                         ▼
                 FORENSIC RECORD`}
                </pre>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-sans text-zinc-700 space-y-1.5">
                <div className="font-bold text-zinc-950 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-zinc-800" />
                  <span>Core Distinction: Distribution vs Execution</span>
                </div>
                <p className="text-[11px] text-zinc-600 leading-relaxed">
                  The website serves as the <strong>distribution and visualization hub</strong>. When you install the package onto your real Kali Linux machine, the native C++20 daemon directly reads from your host's <code className="font-mono text-zinc-900 font-bold">/proc</code>, computes process trees, evaluates blast radius, and applies safe remediation via signals and cgroups quotas.
                </p>
              </div>
            </div>
          )}

          {/* Commands Reference Cheatsheet (Shown across tabs) */}
          <div>
            <div className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2 font-sans flex items-center justify-between">
              <span>Supported Terminal Commands</span>
              <span className="text-[10px] text-zinc-500 font-mono font-normal">POSIX.1-2008 Standard</span>
            </div>

            <div className="rounded-xl border border-zinc-200 overflow-hidden bg-white">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <tbody>
                  {commandsList.map((item, idx) => (
                    <tr 
                      key={idx} 
                      className={`hover:bg-zinc-50 transition border-b border-zinc-100 last:border-0 ${idx % 2 === 0 ? "bg-white" : "bg-zinc-50/50"}`}
                    >
                      <td className="py-2.5 px-3 font-bold text-zinc-950 whitespace-nowrap">
                        <code>{item.cmd}</code>
                      </td>
                      <td className="py-2.5 px-3 text-zinc-600 font-sans text-[11px]">
                        {item.desc}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => copyToClipboard(item.cmd, 10 + idx)}
                          title="Copy command"
                          className="p-1 rounded text-zinc-400 hover:text-zinc-950 hover:bg-zinc-200 transition cursor-pointer inline-flex items-center"
                        >
                          {copiedIndex === 10 + idx ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-zinc-600 font-sans">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Supported: Kali Linux, Debian 11/12, Ubuntu 20.04+, Fedora, Arch Linux</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
