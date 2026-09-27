import React, { useState } from "react";
import { 
  Cpu, 
  Activity, 
  ShieldAlert, 
  Target, 
  Lock, 
  Sliders, 
  CheckCircle2, 
  Layers,
  Code2,
  Check
} from "lucide-react";

export const ModulesVisualizer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);

  const modules = [
    {
      id: "telemetry",
      name: "Telemetry Collector",
      badge: "C++20 /proc Parser",
      icon: Cpu,
      desc: "Low-overhead zero-allocation ingestion directly from the Linux kernel virtual filesystems.",
      inputs: ["/proc/[pid]/stat", "/proc/meminfo", "/proc/loadavg", "cgroups v2 cpu.stat"],
      outputs: ["ProcessRecord", "SystemRecord (sample_time, load, memory, cpu)"],
      features: [
        "Scratch-buffer tokenization avoiding heap fragmentation",
        "UniqueFd and UniqueDir RAII lifecycle management",
        "Sub-millisecond sample time across all system tasks",
        "Tracks utime, stime, RSS, VMS, nice, cgroups, and threads"
      ],
      codeSnippet: `// LinuxTelemetryCollector::sample_process(Pid pid)
std::string stat_path = "/proc/" + std::to_string(pid) + "/stat";
std::ifstream stat_file(stat_path);
// Parse tick deltas against prev_proc_ticks_[pid]
uint64_t total_ticks = utime + stime;
double cpu_pct = calculate_cpu_delta(pid, total_ticks);`
    },
    {
      id: "state",
      name: "OS State Engine",
      badge: "EWMA Baseline Engine",
      icon: Activity,
      desc: "Builds an adaptive statistical baseline of normal behavior rather than static arbitrary thresholds.",
      inputs: ["Raw telemetry streams", "Temporal sample history (60s sliding window)"],
      outputs: ["Baseline means", "Variance & Z-scores", "Process hierarchy graph"],
      features: [
        "EWMA (Exponential Weighted Moving Average) smoothing",
        "Dynamic volatility sensitivity adaptation",
        "Tracks tree relations: parent PID, children list, cgroup slice",
        "Differentiates bursty workloads from monotonic runaway leaks"
      ],
      codeSnippet: `// EWMA State Update
double alpha = 2.0 / (window_size + 1.0);
current_ewma = (alpha * current_sample) + ((1.0 - alpha) * prev_ewma);
double z_score = (current_sample - current_ewma) / std_dev;
if (z_score > 3.0) { mark_statistical_outlier(pid); }`
    },
    {
      id: "risk",
      name: "Risk Engine",
      badge: "Multi-Vector Correlation",
      icon: ShieldAlert,
      desc: "Correlates resource spikes across multiple vectors to eliminate false positives.",
      inputs: ["CPU rate of change", "Memory RSS growth", "Thread/child spawn rate", "I/O wait"],
      outputs: ["RiskSeverity (Info, Low, Medium, High, Critical)", "CorrelatedEvent"],
      features: [
        "Requires concurrent multi-metric anomalies for High/Critical score",
        "Disregards planned high-priority compiler or batch tasks",
        "Generates immutable event token (e.g. OG-2026-00421)",
        "Passes correlated anomaly candidates to Impact Analyzer"
      ],
      codeSnippet: `// Multi-Vector Risk Calculation
if (cpu_growth > threshold && (mem_growth > threshold || child_spawn_rate > threshold)) {
    CorrelatedEvent ev;
    ev.event_id = generate_event_id();
    ev.severity = RiskSeverity::High;
    return ev;
}`
    },
    {
      id: "impact",
      name: "Impact Analyzer",
      badge: "Blast-Radius Matrix",
      icon: Target,
      desc: "Simulates consequences of each candidate remediation action before taking any action on the OS.",
      inputs: ["Target PID", "Process tree descendants", "Service units (systemd)", "Open fds"],
      outputs: ["Action Impact Matrix (Terminate, Isolate, Throttle, Pause, Monitor)"],
      features: [
        "Evaluates whether terminating PID orphans child workers",
        "Checks if process is part of critical system (init, sshd, dockerd)",
        "Calculates disruption score for each candidate action",
        "Defaults to lowest disruption action satisfying safety bounds"
      ],
      codeSnippet: `// Blast-Radius Evaluation
if (is_critical_system(p.comm)) {
    impact.terminate = "CRITICAL (FORBIDDEN)";
    impact.selected_action = RemediationActionType::Monitor;
} else if (p.children.size() > 0) {
    impact.terminate = "HIGH (Orphans child threads)";
    impact.selected_action = RemediationActionType::Throttle;
}`
    },
    {
      id: "policy",
      name: "Policy Engine",
      badge: "Autonomous Rule Gates",
      icon: Lock,
      desc: "Enforces non-negotiable human-defined safety bounds and execution permissions.",
      inputs: ["System policy config", "Audit rules", "Selected action proposal"],
      outputs: ["Approved Action or Veto with reason"],
      features: [
        "Protected process whitelist (init, systemd, sshd, db)",
        "Reversibility gate: requires verified rollback path",
        "Max allowable blast radius threshold check",
        "Strict adherence: least disruptive safe action policy"
      ],
      codeSnippet: `// Policy Enforcement Gate
if (policy.is_protected(target.comm) && action == Action::Terminate) {
    return VETO_PROTECTED_PROCESS;
}
if (!action_is_reversible(action) && !policy.allow_irreversible()) {
    return VETO_REVERSIBILITY_REQUIRED;
}`
    },
    {
      id: "remediation",
      name: "Remediation Engine",
      badge: "Safe Kernel Actuation",
      icon: Sliders,
      desc: "Applies real, progressive, reversible constraints using native Linux primitives.",
      inputs: ["Approved Action", "Target PID"],
      outputs: ["Applied constraint state", "Actuation timestamp"],
      features: [
        "Throttle: Adjusts cgroup cpu.max quota or applies renice +19",
        "Pause: SIGSTOP with planned resumption timer",
        "Isolate: Network net_cls or CPU core affinity pinning",
        "Terminate: SIGTERM with graceful timeout before SIGKILL"
      ],
      codeSnippet: `// Native Progressive Actuation
cgroups::set_cpu_quota(target_pid, "20000 100000"); // 20% limit
// or fallback to renice in userspace:
::setpriority(PRIO_PROCESS, target_pid, 19);`
    },
    {
      id: "forensics",
      name: "Verification & Forensics",
      badge: "Closed-Loop Validation",
      icon: CheckCircle2,
      desc: "Verifies recovery after remediation and writes an immutable forensic audit log.",
      inputs: ["Event ID", "Post-remediation telemetry samples (T+500ms, T+2000ms)"],
      outputs: ["Verification status (Recovered / Rollback)", "Immutable Incident Report"],
      features: [
        "Validates CPU, memory, and dependent service health",
        "Triggers automatic rollback if secondary degradation detected",
        "Records timestamped sequence of evidence, impact, and action",
        "Generates human-readable and JSON forensic report"
      ],
      codeSnippet: `// Verification Checkpoint
bool recovered = (sys.cpu_pct < baseline_limit) && (service_health == HEALTHY);
if (!recovered) { 
    rollback_remediation(event_id); 
} else {
    audit_logger.commit(event_id, "RECOVERED");
}`
    }
  ];

  const current = modules[activeTab];

  return (
    <div id="modules-visualizer-card" className="bg-white border border-zinc-200 rounded-xl p-4 sm:p-5 shadow-xs">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-zinc-200">
        <div>
          <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-zinc-900" />
            OS Guardian Native C++ Architecture Modules
          </h3>
          <p className="text-xs text-zinc-500">
            Modular Linux kernel-interfacing pipeline implementing RAII system resource lifecycles
          </p>
        </div>
        <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-zinc-100 border border-zinc-300 text-zinc-900 font-semibold">
          7 Native Modules
        </span>
      </div>

      {/* Module Selector Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 border-b border-zinc-200 no-scrollbar">
        {modules.map((m, idx) => {
          const Icon = m.icon;
          const isSelected = activeTab === idx;
          return (
            <button
              key={m.id}
              onClick={() => setActiveTab(idx)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isSelected 
                  ? `bg-zinc-950 border-zinc-950 text-white shadow-xs font-semibold` 
                  : `bg-white border-zinc-200 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50`
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{m.name}</span>
            </button>
          );
        })}
      </div>

      {/* Active Module Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Description & Features */}
        <div className="lg:col-span-7 space-y-3.5 text-xs">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
              {React.createElement(current.icon, { className: "w-4 h-4 text-zinc-900" })}
              {current.name}
            </h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-800 font-medium">
              {current.badge}
            </span>
          </div>

          <p className="text-zinc-600 leading-relaxed">
            {current.desc}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-[11px]">
            <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200/80">
              <div className="text-[10px] text-zinc-500 font-bold uppercase mb-1.5">Kernel Inputs / Streams:</div>
              <ul className="space-y-1 text-zinc-800">
                {current.inputs.map((inp, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="text-zinc-950 font-bold">›</span> {inp}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200/80">
              <div className="text-[10px] text-zinc-500 font-bold uppercase mb-1.5">Engine Outputs / Artifacts:</div>
              <ul className="space-y-1 text-zinc-800">
                {current.outputs.map((out, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="text-zinc-950 font-bold">›</span> {out}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="text-[10px] text-zinc-500 font-bold uppercase font-mono">Module Capabilities:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-zinc-800 font-mono">
              {current.features.map((feat, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-zinc-50 border border-zinc-200/80">
                  <Check className="w-3.5 h-3.5 text-zinc-900 flex-shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: C++ Implementation Snippet */}
        <div className="lg:col-span-5 bg-zinc-950 border border-zinc-800 rounded-xl p-4 font-mono text-xs flex flex-col justify-between text-zinc-100 shadow-xs">
          <div>
            <div className="flex items-center justify-between text-zinc-400 text-[10px] pb-2.5 mb-2.5 border-b border-zinc-800">
              <span className="flex items-center gap-1.5 text-zinc-200 font-semibold">
                <Code2 className="w-3.5 h-3.5 text-zinc-200" />
                native/src/{current.id}/
              </span>
              <span>C++20 Linux Native</span>
            </div>

            <pre className="text-zinc-300 text-[11px] whitespace-pre-wrap leading-relaxed font-mono">
              {current.codeSnippet}
            </pre>
          </div>

          <div className="mt-4 pt-2.5 border-t border-zinc-800 text-[10px] text-zinc-400 flex items-center justify-between">
            <span>RAII Guarantees: Zero resource leak</span>
            <span className="text-emerald-400 font-semibold">POSIX Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
};
