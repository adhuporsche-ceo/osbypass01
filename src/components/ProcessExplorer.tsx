import React, { useState, useEffect } from "react";
import { 
  Search, 
  RefreshCw, 
  Info, 
  Shield, 
  X,
  Activity,
  Cpu,
  Layers,
  ArrowRight
} from "lucide-react";
import { ProcessItem, ProcessDetails, ImpactDetails } from "../types";
import { safeFetchJson } from "../common/apiClient";

export const ProcessExplorer: React.FC = () => {
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [selectedPid, setSelectedPid] = useState<number | null>(null);
  const [inspectData, setInspectData] = useState<ProcessDetails | null>(null);
  const [impactData, setImpactData] = useState<ImpactDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchProcesses = async () => {
    setLoading(true);
    try {
      const data = await safeFetchJson<any[]>("/api/processes");
      if (Array.isArray(data)) {
        const mapped = data.map((d: any) => ({
          pid: d.pid,
          ppid: d.ppid,
          user: d.uid === 0 ? "root" : `uid:${d.uid}`,
          comm: d.comm,
          rss_mb: d.rss_bytes ? d.rss_bytes / (1024 * 1024) : (d.rss_mb || 0),
          state: d.state,
          threads: d.threads || 1,
          unit: d.unit || "user.slice"
        }));
        setProcesses(mapped);
      }
    } catch (err) {
      console.warn("Processes notice:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInspect = async (pid: number) => {
    setSelectedPid(pid);
    setLoadingDetails(true);
    try {
      const [inspRes, impRes] = await Promise.all([
        safeFetchJson<ProcessDetails>(`/api/inspect/${pid}`),
        safeFetchJson<ImpactDetails>(`/api/impact/${pid}`)
      ]);
      if (inspRes) setInspectData(inspRes);
      if (impRes) setImpactData(impRes);
    } catch (err) {
      console.warn("Process details notice:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchProcesses();
    // Real-time polling every 2 seconds
    const interval = setInterval(fetchProcesses, 2000);
    return () => clearInterval(interval);
  }, []);

  const filtered = processes.filter(p => 
    p.comm.toLowerCase().includes(filter.toLowerCase()) || 
    p.pid.toString().includes(filter) ||
    p.user.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div id="process-explorer-card" className="bg-white border border-zinc-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col h-[480px]">
      {/* Title & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-zinc-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-zinc-900" />
          <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
            Live Linux Process Engine (/proc)
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-800 border border-zinc-200 font-semibold">
            {processes.length} active tasks
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-zinc-400" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search comm / PID..."
              className="pl-8 pr-2.5 py-1 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 focus:bg-white w-36 sm:w-48 font-mono transition"
            />
          </div>

          <button
            onClick={fetchProcesses}
            disabled={loading}
            className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 transition cursor-pointer"
            title="Refresh processes"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-zinc-950" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Process Table */}
      <div className="flex-1 overflow-y-auto pr-1 text-xs font-mono">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 text-[10px] text-zinc-500 uppercase tracking-wider sticky top-0 bg-zinc-50 z-10">
              <th className="py-2 px-2.5">PID</th>
              <th className="py-2 px-2">PPID</th>
              <th className="py-2 px-2">USER</th>
              <th className="py-2 px-2">MEM(MB)</th>
              <th className="py-2 px-2">THRD</th>
              <th className="py-2 px-2">STATE</th>
              <th className="py-2 px-2">COMMAND</th>
              <th className="py-2 px-2.5 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filtered.map((p) => {
              const isSelected = selectedPid === p.pid;
              return (
                <tr 
                  key={p.pid} 
                  className={`hover:bg-zinc-50 transition cursor-pointer ${
                    isSelected ? "bg-zinc-100/90 text-zinc-950 font-semibold" : "text-zinc-700"
                  }`}
                  onClick={() => handleInspect(p.pid)}
                >
                  <td className="py-2 px-2.5 font-bold text-zinc-950">{p.pid}</td>
                  <td className="py-2 px-2 text-zinc-500">{p.ppid}</td>
                  <td className="py-2 px-2 text-zinc-600">{p.user}</td>
                  <td className="py-2 px-2 text-zinc-900 font-medium">{p.rss_mb.toFixed(1)}</td>
                  <td className="py-2 px-2 text-zinc-500">{p.threads || 1}</td>
                  <td className="py-2 px-2">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono ${
                      p.state === "Running" ? "bg-zinc-950 text-white font-semibold" :
                      p.state === "Sleeping" ? "bg-zinc-100 text-zinc-700 border border-zinc-200" :
                      "bg-amber-100 text-amber-900 border border-amber-200"
                    }`}>
                      {p.state}
                    </span>
                  </td>
                  <td className="py-2 px-2 max-w-[170px] truncate text-zinc-900 font-medium" title={p.comm}>
                    {p.comm}
                  </td>
                  <td className="py-2 px-2.5 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInspect(p.pid);
                      }}
                      className="px-2.5 py-0.5 text-[10px] bg-white hover:bg-zinc-950 hover:text-white text-zinc-800 rounded-md border border-zinc-300 transition cursor-pointer font-mono shadow-2xs"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Inspect & Blast Radius Drawer */}
      {selectedPid && (
        <div className="mt-3 pt-3 border-t border-zinc-200 bg-zinc-50 rounded-xl p-3.5 relative flex-shrink-0 text-xs shadow-xs">
          <button
            onClick={() => setSelectedPid(null)}
            className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-950 transition p-1"
          >
            <X className="w-4 h-4" />
          </button>

          {loadingDetails ? (
            <div className="flex items-center gap-2 text-zinc-600 font-mono py-2">
              <span className="w-2 h-2 rounded-full bg-zinc-950 animate-ping" />
              <span>Inspecting Linux kernel state for /proc/{selectedPid}...</span>
            </div>
          ) : inspectData && impactData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
              {/* Process Metadata */}
              <div>
                <div className="flex items-center gap-1.5 text-zinc-950 font-bold mb-1.5">
                  <Info className="w-3.5 h-3.5 text-zinc-900" />
                  PID {inspectData.pid} [{inspectData.comm}]
                </div>
                <div className="space-y-1 text-[11px] text-zinc-700">
                  <div>PPID: <span className="font-semibold text-zinc-950">{inspectData.ppid}</span> | UID: <span className="font-semibold text-zinc-950">{inspectData.uid}</span></div>
                  <div>State: <span className="font-semibold text-zinc-950">{inspectData.state}</span> | Threads: <span className="font-semibold text-zinc-950">{inspectData.threads}</span></div>
                  <div>CGroup: <span className="text-zinc-600">{inspectData.unit || "user.slice"}</span></div>
                  <div className="truncate text-zinc-500 text-[10px] pt-0.5" title={inspectData.cmdline}>
                    CMD: {inspectData.cmdline}
                  </div>
                </div>
              </div>

              {/* Blast Radius Impact Analysis */}
              <div className="md:border-l md:border-zinc-200 md:pl-4">
                <div className="flex items-center gap-1.5 text-zinc-950 font-bold mb-1.5">
                  <Shield className="w-3.5 h-3.5 text-zinc-900" />
                  Autonomous Impact Analysis
                </div>
                <div className="text-[11px] text-zinc-700 space-y-1">
                  <div>Child Tasks: <span className="font-bold text-zinc-950">{impactData.children_count}</span></div>
                  <div>Protected Service: <span className={impactData.is_critical ? "text-red-700 font-bold" : "text-zinc-600"}>
                    {impactData.is_critical ? "YES (LOCKED)" : "NO"}
                  </span></div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-zinc-500">Safest Action:</span>
                    <span className="px-2 py-0.5 rounded bg-zinc-950 text-white font-bold text-[10px]">
                      {impactData.selected_action}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-500 italic mt-1">
                    "{impactData.reason}"
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-zinc-500 font-mono">Process telemetry unavailable.</div>
          )}
        </div>
      )}
    </div>
  );
};
