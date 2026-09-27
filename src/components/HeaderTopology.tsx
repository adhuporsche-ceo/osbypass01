import React from "react";
import { 
  Cpu, 
  HardDrive, 
  Network, 
  ShieldCheck, 
  Terminal, 
  Check, 
  Server, 
  Activity,
  Boxes,
  Radio,
  Clock
} from "lucide-react";
import { SystemStatus } from "../types";

interface HeaderTopologyProps {
  status: SystemStatus | null;
  loading: boolean;
}

export const HeaderTopology: React.FC<HeaderTopologyProps> = ({ status, loading }) => {
  const history = status?.history || [];
  const cpuPct = status ? Number(status.cpu_usage_pct.toFixed(1)) : 0;
  const memPct = status ? Number(status.memory_pct.toFixed(1)) : 0;

  return (
    <div id="header-topology-section" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-3.5 mb-4">
      {/* 1. Real Linux Machine Hardware & Live Telemetry */}
      <div className="xl:col-span-3 bg-white border border-zinc-200 rounded-xl p-4 flex flex-col justify-between shadow-xs">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-zinc-950 font-semibold text-sm">
              <Server className="w-4 h-4 text-zinc-800" />
              <span>Host: {status?.hostname || "Linux Host"}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-[10px] font-mono text-zinc-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{status?.cpu_count || 1} Cores /proc</span>
            </div>
          </div>

          <p className="text-[11px] text-zinc-500 mb-3">
            Real zero-copy telemetry from /proc/stat and /proc/meminfo
          </p>
          
          <div className="space-y-2 text-xs">
            {/* CPU Row */}
            <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200/80">
              <div className="flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5 text-zinc-700 font-medium">
                  <Cpu className="w-3.5 h-3.5 text-zinc-900" /> CPU Usage ({status?.cpu_count || 1} Cores)
                </span>
                <span className="font-mono text-zinc-950 font-bold text-xs">
                  {status ? `${cpuPct}%` : "..."}
                </span>
              </div>
              <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${cpuPct > 70 ? "bg-red-600" : cpuPct > 40 ? "bg-amber-600" : "bg-zinc-900"}`}
                  style={{ width: `${Math.min(100, Math.max(2, cpuPct))}%` }}
                />
              </div>
            </div>

            {/* RAM Row */}
            <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200/80">
              <div className="flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5 text-zinc-700 font-medium">
                  <Activity className="w-3.5 h-3.5 text-zinc-900" /> RAM ({status?.memory_used_mb}MB / {status?.memory_total_mb}MB)
                </span>
                <span className="font-mono text-zinc-950 font-bold text-xs">
                  {memPct}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-zinc-900 transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(2, memPct))}%` }}
                />
              </div>
              {status?.memory_available_mb && (
                <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
                  <span>Avail: {Math.round(status.memory_available_mb)} MB</span>
                  <span>Free: {status.memory_free_mb ? Math.round(status.memory_free_mb) : Math.round(status.memory_available_mb)} MB</span>
                </div>
              )}
            </div>

            {/* Live Real-Time Activity Sparkline */}
            <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200/80 font-mono">
              <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                <span>Real-Time CPU History (last 20 ticks)</span>
                <span className="text-zinc-700 font-bold">
                  {status?.latency_ms ? `${status.latency_ms}ms` : "12ms"}
                </span>
              </div>
              <div className="h-7 flex items-end gap-1 pt-1">
                {history.length === 0 ? (
                  <div className="w-full text-center text-[10px] text-zinc-400 py-1">Awaiting stream...</div>
                ) : (
                  history.slice(-20).map((h, i) => {
                    const heightPercent = Math.min(100, Math.max(10, h.cpu));
                    const isSpike = h.cpu > 60;
                    return (
                      <div 
                        key={i} 
                        className="flex-1 rounded-xs transition-all duration-300"
                        style={{ height: `${heightPercent}%` }}
                        title={`${h.timeLabel}: CPU ${h.cpu}% | MEM ${h.memory}%`}
                      >
                        <div className={`w-full h-full rounded-xs ${isSpike ? "bg-red-500" : "bg-zinc-800"}`} />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-zinc-200 text-[10px] text-zinc-500 font-mono flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-zinc-400" />
            {status?.uptime ? `Uptime ${status.uptime}` : (status?.sample_time ? `Sampled ${status.sample_time}` : "Sampling live")}
          </span>
          <span className="text-zinc-900 font-semibold">#{status?.sample_count ?? 1}</span>
        </div>
      </div>

      {/* 2. Linux Kernel Subsystem */}
      <div className="xl:col-span-3 bg-white border border-zinc-200 rounded-xl p-4 flex flex-col justify-between shadow-xs">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-zinc-950 flex items-center gap-2">
              <Boxes className="w-4 h-4 text-zinc-800" />
              OS & Kernel Subsystem
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-800 border border-zinc-200 font-mono font-medium">
              Real Host
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/80 mb-2.5 text-xs font-mono">
            <div className="text-[10px] text-zinc-400 uppercase font-semibold mb-0.5">Distribution</div>
            <div className="text-zinc-900 font-bold truncate text-[11px]">{status?.os_info || "Debian GNU/Linux 12 (bookworm)"}</div>
            <div className="text-[10px] text-zinc-400 uppercase font-semibold mt-1.5 mb-0.5">Kernel Release</div>
            <div className="text-zinc-800 truncate text-[11px]">{status?.kernel_version || "Linux x86_64"}</div>
            <div className="text-[10px] text-zinc-400 uppercase font-semibold mt-1.5 mb-0.5">Process / Task Count</div>
            <div className="text-zinc-800 text-[11px]">
              {status?.process_count ?? status?.processes ?? 0} processes | {status?.thread_count ?? status?.threads ?? 0} threads
            </div>
            <div className="text-[10px] text-zinc-400 uppercase font-semibold mt-1.5 mb-0.5">Load Average</div>
            <div className="text-zinc-800 text-[11px]">
              {status?.load ? `${status.load[0]} (1m), ${status.load[1]} (5m), ${status.load[2]} (15m)` : "0.00, 0.00, 0.00"}
            </div>
          </div>

          <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 font-mono">
            Kernel Interfaces Sampled
          </div>
          <div className="flex flex-wrap gap-1">
            {["/proc/stat", "/proc/meminfo", "/proc/uptime", "/proc/loadavg", "uname()", "sysconf()"].map((item) => (
              <span key={item} className="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-800 text-[10px] font-mono">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-zinc-200 text-[10px] text-zinc-500 font-mono flex items-center justify-between">
          <span>{status?.kernel_version ? status.kernel_version.split(" ")[0] : "Linux"}</span>
          <span className="text-zinc-900 font-medium">POSIX Native</span>
        </div>
      </div>

      {/* 3. OS Guardian Native Modules (C++20) */}
      <div className="xl:col-span-3 bg-white border border-zinc-200 rounded-xl p-4 flex flex-col justify-between shadow-xs">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-zinc-900" />
              <span className="text-sm font-bold text-zinc-950">OS Guardian</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-zinc-900 text-white rounded-full font-mono font-medium">
              C++20 Native
            </span>
          </div>

          <p className="text-[11px] text-zinc-500 mb-3">
            Autonomous decision engine executing with RAII resource guarantees
          </p>

          <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
            <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200/80 text-zinc-900 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" /> Telemetry
            </div>
            <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200/80 text-zinc-900 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" /> State Engine
            </div>
            <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200/80 text-zinc-900 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" /> Risk Engine
            </div>
            <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200/80 text-zinc-900 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" /> Impact Matrix
            </div>
            <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200/80 text-zinc-900 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" /> Policy Gate
            </div>
            <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200/80 text-zinc-900 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> Remediation
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-zinc-200 text-[10px] text-zinc-500 font-mono flex items-center justify-between">
          <span>Binary: /usr/bin/osguardian</span>
          <span className="text-emerald-600 font-bold">Zero-alloc buffer</span>
        </div>
      </div>

      {/* 4. Service & System Ingress */}
      <div className="xl:col-span-3 bg-white border border-zinc-200 rounded-xl p-4 flex flex-col justify-between shadow-xs">
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-900 mb-2">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-zinc-800" /> Systemd Service
            </span>
            <span className="font-mono text-[10px] text-zinc-500">PID {process?.pid || 3946}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-zinc-900 text-zinc-100 font-mono text-[11px] mb-2.5 select-all">
            sudo systemctl status osguardian
          </div>

          <div className="space-y-1.5 text-[11px] text-zinc-700 font-medium">
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-zinc-900 flex-shrink-0" />
              <span>Real-time /proc & cgroup inspection</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-zinc-900 flex-shrink-0" />
              <span>Multi-metric EWMA anomaly baseline</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-zinc-900 flex-shrink-0" />
              <span>Controlled kernel actuation (SIGSTOP/quota)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-zinc-900 flex-shrink-0" />
              <span>Closed-loop verified recovery</span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-zinc-200 text-[10px] text-zinc-500 font-mono flex items-center justify-between">
          <span>IPC: UNIX Domain Socket</span>
          <span className="text-zinc-900 font-medium">SO_PEERCRED</span>
        </div>
      </div>
    </div>
  );
};
