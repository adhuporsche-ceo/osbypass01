import React, { useState, useEffect, useCallback } from "react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ReferenceLine 
} from "recharts";
import { 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  Cpu, 
  HardDrive, 
  ShieldAlert, 
  CheckCircle2, 
  Info, 
  SlidersHorizontal,
  RefreshCw,
  ExternalLink,
  Flame,
  Zap
} from "lucide-react";
import { ProcessSparklineData, ProcessUtilizationPoint, Incident } from "../types";
import { safeFetchJson } from "../common/apiClient";

interface ProcessUtilizationSparklinesProps {
  activeIncident?: Incident | null;
  onInspectPid?: (pid: number) => void;
  onRemediateIncident?: (eventId: string, action: string) => void;
}

export const ProcessUtilizationSparklines: React.FC<ProcessUtilizationSparklinesProps> = ({
  activeIncident,
  onInspectPid,
  onRemediateIncident
}) => {
  const [data, setData] = useState<ProcessSparklineData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [metricView, setMetricView] = useState<"dual" | "cpu" | "memory">("dual");
  const [selectedProcessPid, setSelectedProcessPid] = useState<number | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");
  const [activeAnomaliesCount, setActiveAnomaliesCount] = useState<number>(0);

  const fetchHistory = useCallback(async () => {
    try {
      const json = await safeFetchJson<any>("/api/processes/utilization-history");
      if (json && Array.isArray(json.topProcesses)) {
        setData(json.topProcesses);
        setActiveAnomaliesCount(json.activeAnomaliesCount || 0);
        setLastRefreshed(json.timeLabel || new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.warn("Sparklines history notice:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 1200);
    return () => clearInterval(interval);
  }, [fetchHistory]);

  return (
    <section 
      id="top-processes-sparkline-section" 
      className="bg-white border border-zinc-200 rounded-xl p-4 sm:p-5 shadow-xs"
    >
      {/* Header Bar with Controls & Metrics Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 mb-4 border-b border-zinc-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-950 text-white flex items-center justify-center shadow-xs">
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-zinc-950 uppercase tracking-wider">
                Top 5 Active Processes &amp; Historical Baseline Anomaly Engine
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-800 font-semibold">
                recharts sparklines
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Live zero-copy sampling of task CPU &amp; RSS trajectories with statistical baseline threshold anomaly mapping
            </p>
          </div>
        </div>

        {/* Right Controls: Metric View Toggle & Anomaly Count Badge */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap font-mono text-xs">
          {/* Active Baseline Anomaly Pill */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${
            activeAnomaliesCount > 0 
              ? "bg-red-50 border-red-200 text-red-700" 
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
          }`}>
            {activeAnomaliesCount > 0 ? (
              <>
                <Flame className="w-3.5 h-3.5 text-red-600 animate-pulse" />
                <span>{activeAnomaliesCount} Baseline {activeAnomaliesCount === 1 ? "Spike" : "Spikes"} Detected</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Baselines Nominal</span>
              </>
            )}
          </div>

          {/* Metric View Switcher */}
          <div className="flex items-center bg-zinc-100 border border-zinc-200 rounded-lg p-0.5 text-[11px]">
            <button
              id="sparkline-view-dual-btn"
              onClick={() => setMetricView("dual")}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                metricView === "dual" 
                  ? "bg-white text-zinc-950 font-bold shadow-2xs" 
                  : "text-zinc-600 hover:text-zinc-950"
              }`}
            >
              Dual (CPU + RAM)
            </button>
            <button
              id="sparkline-view-cpu-btn"
              onClick={() => setMetricView("cpu")}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                metricView === "cpu" 
                  ? "bg-white text-zinc-950 font-bold shadow-2xs" 
                  : "text-zinc-600 hover:text-zinc-950"
              }`}
            >
              CPU Spikes (%)
            </button>
            <button
              id="sparkline-view-memory-btn"
              onClick={() => setMetricView("memory")}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                metricView === "memory" 
                  ? "bg-white text-zinc-950 font-bold shadow-2xs" 
                  : "text-zinc-600 hover:text-zinc-950"
              }`}
            >
              Memory RSS (MB)
            </button>
          </div>

          <button
            onClick={fetchHistory}
            className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 cursor-pointer shadow-2xs"
            title="Refresh process telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-zinc-950" : ""}`} />
          </button>
        </div>
      </div>

      {/* Grid of Top 5 Process Cards with Recharts Sparklines */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3.5">
        {data.map((proc, index) => {
          const isSpike = proc.hasSpike || Boolean(proc.anomaly);
          const isTargetedByFault = activeIncident && (
            activeIncident.pid === proc.pid || 
            proc.comm.includes("test_worker") ||
            activeIncident.process === proc.comm
          );
          const isSelected = selectedProcessPid === proc.pid;

          return (
            <div
              key={proc.pid}
              id={`process-sparkline-card-${proc.pid}`}
              onClick={() => setSelectedProcessPid(proc.pid === selectedProcessPid ? null : proc.pid)}
              className={`rounded-xl border p-3.5 flex flex-col justify-between transition-all duration-200 cursor-pointer ${
                isSpike || isTargetedByFault
                  ? "border-red-300 bg-red-50/30 shadow-xs ring-1 ring-red-200"
                  : isSelected
                  ? "border-zinc-950 bg-zinc-50/50 shadow-xs"
                  : "border-zinc-200 bg-white hover:border-zinc-300 shadow-2xs"
              }`}
            >
              {/* Card Header: Rank, Process Comm & PID */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center font-mono text-[10px] font-bold ${
                      index === 0 
                        ? (isSpike ? "bg-red-600 text-white" : "bg-zinc-950 text-white") 
                        : "bg-zinc-100 text-zinc-700 border border-zinc-200"
                    }`}>
                      #{index + 1}
                    </span>
                    <span 
                      className="font-mono font-bold text-xs text-zinc-950 truncate max-w-[110px]" 
                      title={proc.comm}
                    >
                      {proc.comm}
                    </span>
                  </div>

                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                    PID {proc.pid}
                  </span>
                </div>

                {/* Sub-header: User & State */}
                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono mb-2.5">
                  <span>{proc.user} • {proc.state}</span>
                  <span>{proc.threads} threads</span>
                </div>

                {/* Live Utilization Metrics vs Baseline */}
                <div className="grid grid-cols-2 gap-1.5 mb-2 font-mono text-xs">
                  {/* CPU Column */}
                  <div className={`p-1.5 rounded-lg border ${
                    proc.currentCpu > proc.cpuThreshold || isTargetedByFault
                      ? "bg-red-50 border-red-200 text-red-950"
                      : "bg-zinc-50 border-zinc-200/80 text-zinc-900"
                  }`}>
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-0.5">
                      <span className="flex items-center gap-1">
                        <Cpu className="w-3 h-3" /> CPU
                      </span>
                      {proc.currentCpu > proc.cpuThreshold && (
                        <Flame className="w-3 h-3 text-red-600 animate-pulse" />
                      )}
                    </div>
                    <div className="font-bold text-xs">
                      {proc.currentCpu}%
                    </div>
                    <div className="text-[9px] text-zinc-500 truncate">
                      Base: {proc.baselineCpu}%
                    </div>
                  </div>

                  {/* RAM Column */}
                  <div className={`p-1.5 rounded-lg border ${
                    proc.currentMemoryMb > proc.memoryThreshold
                      ? "bg-amber-50 border-amber-200 text-amber-950"
                      : "bg-zinc-50 border-zinc-200/80 text-zinc-900"
                  }`}>
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-0.5">
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3" /> RAM
                      </span>
                    </div>
                    <div className="font-bold text-xs">
                      {Math.round(proc.currentMemoryMb)} MB
                    </div>
                    <div className="text-[9px] text-zinc-500 truncate">
                      Base: {Math.round(proc.baselineMemoryMb)} MB
                    </div>
                  </div>
                </div>

                {/* Sparkline Visualization using Recharts */}
                <div className="h-16 w-full rounded-lg bg-zinc-50/70 border border-zinc-200/80 p-1 mb-2">
                  <ResponsiveContainer width="100%" height="100%">
                    {metricView === "dual" ? (
                      <AreaChart data={proc.history} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                        <defs>
                          <linearGradient id={`grad-cpu-${proc.pid}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={isSpike ? "#dc2626" : "#18181b"} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={isSpike ? "#dc2626" : "#18181b"} stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id={`grad-mem-${proc.pid}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#c08a3e" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#c08a3e" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <YAxis hide domain={[0, 'dataMax + 10']} />
                        <XAxis dataKey="timeLabel" hide />
                        <Tooltip content={<ProcessSparklineTooltip procName={proc.comm} />} />
                        <ReferenceLine 
                          y={proc.cpuThreshold} 
                          stroke="#dc2626" 
                          strokeDasharray="2 2" 
                          strokeWidth={1}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="cpu" 
                          name="CPU (%)"
                          stroke={isSpike ? "#dc2626" : "#18181b"} 
                          strokeWidth={1.5}
                          fill={`url(#grad-cpu-${proc.pid})`} 
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    ) : metricView === "cpu" ? (
                      <AreaChart data={proc.history} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                        <defs>
                          <linearGradient id={`grad-cpu-only-${proc.pid}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={isSpike ? "#dc2626" : "#09090b"} stopOpacity={0.5} />
                            <stop offset="95%" stopColor={isSpike ? "#dc2626" : "#09090b"} stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <YAxis hide domain={[0, 'dataMax + 5']} />
                        <XAxis dataKey="timeLabel" hide />
                        <Tooltip content={<ProcessSparklineTooltip procName={proc.comm} />} />
                        <ReferenceLine 
                          y={proc.cpuThreshold} 
                          stroke="#dc2626" 
                          strokeDasharray="2 2" 
                          strokeWidth={1}
                        />
                        <ReferenceLine 
                          y={proc.baselineCpu} 
                          stroke="#71717a" 
                          strokeDasharray="2 2" 
                          strokeWidth={1}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="cpu" 
                          name="CPU (%)"
                          stroke={isSpike ? "#dc2626" : "#18181b"} 
                          strokeWidth={1.5}
                          fill={`url(#grad-cpu-only-${proc.pid})`} 
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    ) : (
                      <AreaChart data={proc.history} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                        <defs>
                          <linearGradient id={`grad-mem-only-${proc.pid}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#c08a3e" stopOpacity={0.45} />
                            <stop offset="95%" stopColor="#c08a3e" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                        <XAxis dataKey="timeLabel" hide />
                        <Tooltip content={<ProcessSparklineTooltip procName={proc.comm} />} />
                        <ReferenceLine 
                          y={proc.memoryThreshold} 
                          stroke="#d97706" 
                          strokeDasharray="2 2" 
                          strokeWidth={1}
                        />
                        <ReferenceLine 
                          y={proc.baselineMemoryMb} 
                          stroke="#71717a" 
                          strokeDasharray="2 2" 
                          strokeWidth={1}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="memoryMb" 
                          name="RAM (MB)"
                          stroke="#b47f32" 
                          strokeWidth={1.5}
                          fill={`url(#grad-mem-only-${proc.pid})`} 
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Card Footer: Direct Historical Baseline Anomaly Mapping */}
              <div className="pt-2 border-t border-zinc-200/80">
                {proc.anomaly ? (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-2 text-[10px] font-mono text-red-900">
                    <div className="flex items-center justify-between font-bold mb-0.5">
                      <span className="flex items-center gap-1 text-red-700">
                        <ShieldAlert className="w-3 h-3 text-red-600" />
                        {proc.anomaly.title}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-red-600 text-white text-[9px]">
                        {proc.anomaly.severity}
                      </span>
                    </div>
                    <p className="text-[10px] text-red-800 leading-tight mb-1.5 line-clamp-2">
                      {proc.anomaly.description}
                    </p>
                    {proc.anomaly.correlatedIncidentId && (
                      <div className="text-[9px] text-red-600 font-semibold mb-1">
                        Correlated: {proc.anomaly.correlatedIncidentId}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      {onInspectPid && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onInspectPid(proc.pid);
                          }}
                          className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[9px] font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <span>Inspect PID</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      )}
                      {proc.anomaly.correlatedIncidentId && onRemediateIncident && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (proc.anomaly?.correlatedIncidentId) {
                              onRemediateIncident(proc.anomaly.correlatedIncidentId, "THROTTLE");
                            }
                          }}
                          className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-[9px] font-bold transition cursor-pointer"
                        >
                          Auto-Throttle
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                    <span className="flex items-center gap-1 text-emerald-700">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Baseline Stable
                    </span>
                    {onInspectPid && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspectPid(proc.pid);
                        }}
                        className="text-zinc-600 hover:text-zinc-950 font-bold underline cursor-pointer text-[9px]"
                      >
                        Inspect
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Baseline Anomaly Reference Footer Legend */}
      <div className="mt-3.5 pt-3 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-3 text-[11px] text-zinc-500 font-mono">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-zinc-900 rounded-full" />
            <span className="text-zinc-800 font-medium">Solid Line: Current Utilization Trajectory</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-red-500 border-b border-dashed border-red-500" />
            <span className="text-zinc-800 font-medium">Dashed Red: Statistical Baseline Spike Threshold (2.2× μ)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-zinc-400 border-b border-dashed border-zinc-400" />
            <span className="text-zinc-800 font-medium">Dashed Gray: Rolling Historical Mean (μ)</span>
          </div>
        </div>

        <div className="text-zinc-600">
          Last Sample: <span className="text-zinc-900 font-bold">{lastRefreshed || "Real-time"}</span>
        </div>
      </div>
    </section>
  );
};

// Custom Tooltip for Recharts Process Sparkline
const ProcessSparklineTooltip = ({ active, payload, label, procName }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as ProcessUtilizationPoint;
    return (
      <div className="bg-zinc-950 text-white rounded-lg p-2 text-[10px] font-mono shadow-md border border-zinc-800 pointer-events-none z-50">
        <div className="text-zinc-400 font-bold mb-1 border-b border-zinc-800 pb-0.5">
          {procName} • {data.timeLabel}
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-zinc-400">CPU Usage:</span>
            <span className={`font-bold ${data.cpu > 20 ? "text-red-400" : "text-emerald-400"}`}>
              {data.cpu}%
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-zinc-400">Memory RSS:</span>
            <span className="font-bold text-[#d4a76a]">{Math.round(data.memoryMb)} MB</span>
          </div>
          {data.isSpike && (
            <div className="pt-1 mt-1 border-t border-zinc-800 text-red-400 font-bold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-red-400" />
              <span>Baseline Breach Detected</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};
