import React, { useState, useEffect, useCallback } from "react";
import { 
  ShieldCheck, 
  Activity, 
  Terminal, 
  Cpu, 
  RefreshCw,
  Sliders,
  CheckCircle2,
  Server,
  Layers,
  Radio,
  Clock,
  Gauge,
  Download,
  Copy,
  Check,
  Code2
} from "lucide-react";
import { SystemStatus, Incident } from "./types";
import { HeaderTopology } from "./components/HeaderTopology";
import { ProcessUtilizationSparklines } from "./components/ProcessUtilizationSparklines";
import { DemoFlow } from "./components/DemoFlow";
import { TerminalConsole } from "./components/TerminalConsole";
import { ProcessExplorer } from "./components/ProcessExplorer";
import { ModulesVisualizer } from "./components/ModulesVisualizer";
import { BinaryDownloadModal } from "./components/BinaryDownloadModal";
import { BootIntroScreen } from "./components/BootIntroScreen";
import { PeacockLogo } from "./components/PeacockLogo";
import { safeFetchJson } from "./common/apiClient";

export function App() {
  const [showBootScreen, setShowBootScreen] = useState<boolean>(true);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingAction, setLoadingAction] = useState<boolean>(false);
  const [activeViewTab, setActiveViewTab] = useState<"terminal" | "modules">("terminal");
  const [pollingIntervalMs, setPollingIntervalMs] = useState<number>(1000); // 1.0s real-time
  const [lastTickTime, setLastTickTime] = useState<string>("");
  const [showDownloadModal, setShowDownloadModal] = useState<boolean>(false);
  const [bannerCopied, setBannerCopied] = useState<boolean>(false);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await safeFetchJson<SystemStatus>("/api/status");
      if (data) {
        setStatus(data);
        setLastTickTime(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.warn("Status tick notice:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const events = await safeFetchJson<Incident[]>("/api/events");
      if (Array.isArray(events) && events.length > 0) {
        setActiveIncident(events[0]);
      }
    } catch (err) {
      console.warn("Events tick notice:", err);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchEvents();
    const interval = setInterval(() => {
      fetchStatus();
      fetchEvents();
    }, pollingIntervalMs);
    return () => clearInterval(interval);
  }, [fetchStatus, fetchEvents, pollingIntervalMs]);

  const handleInjectFault = async () => {
    setLoadingAction(true);
    try {
      const data = await safeFetchJson<any>("/api/fault/inject", { method: "POST" });
      if (data?.incident) {
        setActiveIncident(data.incident);
        fetchStatus();
      }
    } catch (err) {
      console.error("Fault injection failed:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRemediate = async (eventId: string, action: string) => {
    setLoadingAction(true);
    try {
      const data = await safeFetchJson<any>("/api/fault/remediate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, action })
      });
      if (data?.incident) {
        setActiveIncident(data.incident);
        fetchStatus();
      }
    } catch (err) {
      console.error("Remediation failed:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleVerify = async (eventId: string) => {
    setLoadingAction(true);
    try {
      const data = await safeFetchJson<any>("/api/fault/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId })
      });
      if (data?.incident) {
        setActiveIncident(data.incident);
        fetchStatus();
      }
    } catch (err) {
      console.error("Verification failed:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleReset = () => {
    setActiveIncident(null);
    fetchStatus();
  };

  const isAnomaly = Boolean(activeIncident && !activeIncident.remediated);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-900 flex flex-col font-sans selection:bg-[#52432F] selection:text-white">
      {/* 3-Second Distrobyetz OS Boot Intro Screen */}
      {showBootScreen && (
        <BootIntroScreen 
          durationMs={3000} 
          onComplete={() => setShowBootScreen(false)} 
        />
      )}

      {/* Top Navigation Bar in Clean White & Beige */}
      <header className="border-b border-[#E7DFCE] bg-white sticky top-0 z-30 px-4 sm:px-6 py-3 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAF6EE] text-[#5A472A] flex items-center justify-center shadow-xs border border-[#E2DAC8] overflow-hidden group">
              <PeacockLogo size={36} withGlow={false} theme="beige" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-bold text-stone-950 tracking-tight">DISTROBYETZ</h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F4EFE6] border border-[#E2DAC8] text-[#5E513D] font-semibold">
                  OS Guardian v1.0.0
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FAF6EE] border border-[#E0D5C1] text-[#78613A] font-bold shadow-2xs">
                  Developed By ~ADHITHYA
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Native Linux Autonomous Security, Observability &amp; Remediation Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs font-mono">
            {/* Replay 3-Second OS Boot Screen Button in Clean White & Beige */}
            <button
              id="header-replay-boot-screen-btn"
              onClick={() => setShowBootScreen(true)}
              title="Replay 3-second Distrobyetz OS boot screen"
              className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#FAF7F2] text-[#635338] border border-[#DDD3BF] hover:border-[#C4B79E] transition flex items-center gap-1.5 font-mono text-xs font-semibold cursor-pointer shadow-2xs"
            >
              <PeacockLogo size={16} withGlow={false} theme="beige" />
              <span className="hidden sm:inline">Boot Screen (3s)</span>
            </button>

            {/* Real-Time Live Status Pill */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#FDFBF7] border border-[#EAE2D2]">
              <span className={`w-2 h-2 rounded-full ${
                isAnomaly ? "bg-red-600 animate-ping" : "bg-emerald-600 animate-pulse"
              }`} />
              <span className="text-stone-500 hidden sm:inline">Daemon:</span>
              <span className={`font-bold ${isAnomaly ? "text-red-700" : "text-stone-900"}`}>
                {isAnomaly ? "ANOMALY_ACTIVE" : "ACTIVE"}
              </span>
            </div>

            {/* Socket Endpoint Pill */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg bg-[#FDFBF7] border border-[#EAE2D2]">
              <span className="text-stone-400">IPC:</span>
              <span className="text-stone-800 font-medium">/run/osguardian.sock</span>
            </div>

            {/* Live Streaming Rate Selector */}
            <div className="flex items-center rounded-lg bg-[#F4EFE6] border border-[#E2DAC8] p-0.5 text-[11px]">
              <button 
                onClick={() => setPollingIntervalMs(1000)}
                className={`px-2 py-0.5 rounded-md transition font-mono ${pollingIntervalMs === 1000 ? "bg-white font-bold text-stone-950 shadow-2xs border border-[#E2DAC8]" : "text-stone-500 hover:text-stone-900"}`}
                title="1.0 second real-time updates"
              >
                1s
              </button>
              <button 
                onClick={() => setPollingIntervalMs(2000)}
                className={`px-2 py-0.5 rounded-md transition font-mono ${pollingIntervalMs === 2000 ? "bg-white font-bold text-stone-950 shadow-2xs border border-[#E2DAC8]" : "text-stone-500 hover:text-stone-900"}`}
                title="2.0 second update interval"
              >
                2s
              </button>
            </div>

            {/* Top Download Package Buttons */}
            <div className="flex items-center gap-1.5">
              <a
                id="top-header-download-deb-btn"
                href="/api/download/osguardian.deb"
                download="osguardian_1.0.0_amd64.deb"
                onClick={() => setShowDownloadModal(true)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Download Kali / Debian (.deb) package"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Kali .deb (43KB)</span>
              </a>

              <a
                id="top-header-download-binary-btn"
                href="/api/download/osguardian"
                download="osguardian"
                onClick={() => setShowDownloadModal(true)}
                className="px-3 py-1.5 rounded-lg bg-[#3B3022] hover:bg-[#2B2318] text-white font-mono text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Click to download Linux x86_64 osguardian binary"
              >
                <Download className="w-3.5 h-3.5 text-[#E6C885]" />
                <span>Binary (121KB)</span>
              </a>
            </div>

            {/* Manual Refresh Button */}
            <button
              onClick={fetchStatus}
              title="Manual telemetry sample"
              className="p-2 rounded-lg bg-white hover:bg-[#FAF7F2] text-stone-700 border border-[#E0D5C1] transition cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-stone-950" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Top Direct Download & Kali Quickstart Banner in White & Beige */}
      <div id="top-binary-download-banner" className="bg-white border-b border-[#E7DFCE] py-2.5 px-4 sm:px-6 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span className="font-bold text-stone-950 font-sans">
              Kali / Linux Distribution:
            </span>
            <span className="text-stone-600 hidden lg:inline font-sans">
              Install native package <code className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-mono font-bold">osguardian.deb</code> or standalone executable on your real host.
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Direct .deb Download Button */}
            <a
              id="banner-direct-deb-download-btn"
              href="/api/download/osguardian.deb"
              download="osguardian_1.0.0_amd64.deb"
              onClick={() => setShowDownloadModal(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>osguardian.deb (43KB)</span>
            </a>

            {/* Standalone Binary Download */}
            <a
              id="banner-direct-download-btn"
              href="/api/download/osguardian"
              download="osguardian"
              onClick={() => setShowDownloadModal(true)}
              className="px-3 py-1.5 bg-[#3B3022] hover:bg-[#2B2318] text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-[#E6C885]" />
              <span>Binary (121KB)</span>
            </a>

            {/* Quick Kali Command Box */}
            <button
              onClick={() => {
                navigator.clipboard.writeText("sudo dpkg -i osguardian.deb && osguardian status");
                setBannerCopied(true);
                setTimeout(() => setBannerCopied(false), 2000);
              }}
              className="px-2.5 py-1.5 bg-[#FDFBF7] hover:bg-[#F5EFE4] text-stone-900 border border-[#DDD3BF] rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer font-mono shadow-2xs"
              title="Click to copy: sudo dpkg -i osguardian.deb && osguardian status"
            >
              {bannerCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{bannerCopied ? "Copied Kali Command!" : "sudo dpkg -i osguardian.deb && osguardian status"}</span>
            </button>

            {/* Installation Hub Modal Trigger */}
            <button
              onClick={() => setShowDownloadModal(true)}
              className="px-2.5 py-1.5 bg-white hover:bg-[#FAF7F2] text-stone-700 hover:text-stone-950 border border-[#E0D5C1] rounded-lg text-xs transition cursor-pointer font-sans font-medium shadow-2xs"
            >
              Package Hub &amp; Flow
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-4">
        {/* Top Section: System Hardware & Kernel Subsystem Topology */}
        <HeaderTopology status={status} loading={loading} />

        {/* Real-Time Sparkline Engine for Top 5 Processes mapped to Historical Baseline Anomalies */}
        <ProcessUtilizationSparklines 
          activeIncident={activeIncident}
          onRemediateIncident={(eventId, action) => handleRemediate(eventId, action)}
          onInspectPid={(pid) => {
            setActiveViewTab("terminal");
            const elem = document.getElementById("process-explorer-card");
            if (elem) elem.scrollIntoView({ behavior: "smooth" });
          }}
        />

        {/* Middle Section: Real-Time 7-Step Demo Flow */}
        <DemoFlow 
          status={status}
          activeIncident={activeIncident}
          onInjectFault={handleInjectFault}
          onRemediate={handleRemediate}
          onVerify={handleVerify}
          onReset={handleReset}
          loadingAction={loadingAction}
        />

        {/* View Toggle Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E7DFCE] pb-3 pt-1">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#EDE7DA] border border-[#DFD6C3] text-xs font-mono">
            <button
              onClick={() => setActiveViewTab("terminal")}
              className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-2 cursor-pointer ${
                activeViewTab === "terminal"
                  ? "bg-white text-stone-950 font-bold shadow-2xs border border-[#DFD6C3]"
                  : "text-stone-600 hover:text-stone-950"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Interactive CLI & Process Engine</span>
            </button>

            <button
              onClick={() => setActiveViewTab("modules")}
              className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-2 cursor-pointer ${
                activeViewTab === "modules"
                  ? "bg-white text-stone-950 font-bold shadow-2xs border border-[#DFD6C3]"
                  : "text-stone-600 hover:text-stone-950"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>C++ Modules Architecture</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-stone-500 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Telemetry stream active</span>
            {lastTickTime && <span>• {lastTickTime}</span>}
          </div>
        </div>

        {/* Dynamic Main Interactive Content */}
        {activeViewTab === "terminal" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Col: Interactive Terminal Console */}
            <div className="lg:col-span-6">
              <TerminalConsole />
            </div>

            {/* Right Col: Live Linux Process Explorer & Blast Radius */}
            <div className="lg:col-span-6">
              <ProcessExplorer />
            </div>
          </div>
        ) : (
          <ModulesVisualizer />
        )}
      </main>

      {/* Footer System Guarantees & Host Info in White & Beige */}
      <footer className="border-t border-[#E7DFCE] bg-white py-3.5 px-4 sm:px-6 text-xs font-mono text-stone-500 mt-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-stone-900 font-semibold">
              <PeacockLogo size={14} withGlow={false} theme="beige" /> Distrobyetz OS
            </span>
            <span className="text-[#78613A] bg-[#FAF6EE] px-2 py-0.5 rounded font-bold border border-[#E0D5C1]">
              Developed By ~ADHITHYA
            </span>
            <span className="hidden sm:inline">Kernel: 6.8+ native</span>
            <span className="hidden md:inline">ELF: /usr/bin/osguardian</span>
          </div>

          <div className="text-[11px] text-stone-500">
            Observe → Understand → Correlate → Explain → Predict Impact → Remediate Safely → Verify
          </div>
        </div>
      </footer>

      {/* Binary Download & Quickstart Modal */}
      <BinaryDownloadModal 
        isOpen={showDownloadModal} 
        onClose={() => setShowDownloadModal(false)} 
      />
    </div>
  );
}

export default App;
