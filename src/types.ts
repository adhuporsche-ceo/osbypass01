export interface MetricTick {
  timestamp: string;
  timeLabel: string;
  cpu: number;
  memory: number;
  load: number;
}

export interface ProcessItem {
  pid: number;
  ppid: number;
  user: string;
  comm: string;
  rss_mb: number;
  state: string;
  threads?: number;
  unit?: string;
}

export interface SystemStatus {
  status: string;
  hostname?: string;
  kernel_version?: string;
  os_info?: string;
  uptime_seconds?: number;
  uptime?: string;
  cpu_count?: number;
  cpu_usage_pct: number;
  memory_used_mb: number;
  memory_total_mb: number;
  memory_available_mb?: number;
  memory_free_mb?: number;
  memory_pct: number;
  load: [number, number, number];
  load_average?: [number, number, number];
  processes: number;
  process_count?: number;
  threads: number;
  thread_count?: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  autonomous_mode: string;
  top_processes: ProcessItem[];
  history?: MetricTick[];
  sample_time?: string;
  sample_count?: number;
  latency_ms?: number;
}

export interface ProcessUtilizationPoint {
  timeLabel: string;
  timestamp: string;
  cpu: number;
  memoryMb: number;
  memoryPct: number;
  isSpike: boolean;
  anomalyScore?: number;
}

export interface ProcessBaselineAnomaly {
  anomalyType: "CPU_SPIKE" | "MEMORY_SURGE" | "RUNAWAY_LEAK" | "BASELINE_DEVIATION";
  title: string;
  description: string;
  severity: "CRITICAL" | "HIGH" | "ELEVATED" | "NOMINAL";
  currentValue: number;
  baselineValue: number;
  deviationPct: number;
  detectedAt: string;
  correlatedIncidentId?: string;
}

export interface ProcessSparklineData {
  pid: number;
  ppid: number;
  comm: string;
  user: string;
  state: string;
  threads: number;
  currentCpu: number;
  currentMemoryMb: number;
  currentMemoryPct: number;
  baselineCpu: number;
  baselineMemoryMb: number;
  cpuThreshold: number;
  memoryThreshold: number;
  hasSpike: boolean;
  history: ProcessUtilizationPoint[];
  anomaly?: ProcessBaselineAnomaly | null;
}

export interface Incident {
  eventId: string;
  pid: number;
  process: string;
  cpuGrowth: string;
  memoryGrowth: string;
  childProcesses: string;
  riskLevel: "HIGH" | "MEDIUM" | "LOW";
  detectedAt: string;
  impactMatrix: {
    terminate: string;
    isolate: string;
    throttle: string;
    pause: string;
    monitor: string;
  };
  selectedAction: "THROTTLE" | "PAUSE" | "ISOLATE" | "TERMINATE" | "MONITOR";
  actionReason: string;
  remediated: boolean;
  remediatedAt?: string;
  actionApplied?: string;
  verified: boolean;
  verifiedAt?: string;
  recoveryDetails?: {
    cpuRecovered: boolean;
    memoryStable: boolean;
    serviceHealth: "HEALTHY" | "DEGRADED" | "CRITICAL";
    newFailures: string;
    rollbackNeeded: boolean;
  };
}

export interface ProcessDetails {
  pid: number;
  ppid: number;
  comm: string;
  cmdline: string;
  state: string;
  uid: number;
  gid: number;
  rss_bytes: number;
  threads: number;
  nice: number;
  unit: string;
  cgroup: string;
}

export interface ImpactDetails {
  target_pid: number;
  process: string;
  children_count: number;
  service_unit: string;
  is_critical: boolean;
  impact_matrix: {
    TERMINATE: string;
    ISOLATE: string;
    THROTTLE: string;
    PAUSE: string;
    MONITOR: string;
  };
  selected_action: string;
  reason: string;
}
