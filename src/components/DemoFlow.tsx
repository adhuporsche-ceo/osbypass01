import React, { useState } from "react";
import { 
  Play, 
  AlertTriangle, 
  Activity, 
  Sliders, 
  CheckCircle2, 
  FileText, 
  RotateCcw,
  ArrowRight,
  Zap,
  Info,
  ShieldAlert,
  Check,
  Flame,
  Clock
} from "lucide-react";
import { SystemStatus, Incident } from "../types";

interface DemoFlowProps {
  status: SystemStatus | null;
  activeIncident: Incident | null;
  onInjectFault: () => Promise<void>;
  onRemediate: (eventId: string, action: string) => Promise<void>;
  onVerify: (eventId: string) => Promise<void>;
  onReset: () => void;
  loadingAction: boolean;
}

export const DemoFlow: React.FC<DemoFlowProps> = ({
  status,
  activeIncident,
  onInjectFault,
  onRemediate,
  onVerify,
  onReset,
  loadingAction
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);

  // Auto-sync step based on incident state
  React.useEffect(() => {
    if (!activeIncident) {
      setActiveStep(1);
    } else if (activeIncident.verified) {
      setActiveStep(7);
    } else if (activeIncident.remediated) {
      setActiveStep(6);
    } else {
      setActiveStep(3);
    }
  }, [activeIncident]);

  const cpuVal = status ? `${status.cpu_usage_pct.toFixed(1)}%` : "18.4%";
  const memVal = status ? `${status.memory_pct.toFixed(1)}%` : "41.7%";
  const targetPid = activeIncident?.pid ?? 4821;

  return (
    <div id="demo-flow-card" className="bg-white border border-zinc-200 rounded-xl p-4 sm:p-5 mb-4 shadow-xs">
      {/* Title & Stage Controller */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
              <Zap className="w-4 h-4 text-zinc-900" />
              <span>Closed-Loop Autonomous Remediation Lifecycle</span>
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-800 font-semibold">
              Live Host Engine
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            Observe → Understand → Correlate → Predict Impact → Remediate Safely → Verify
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeIncident && (
            <button
              id="reset-demo-btn"
              onClick={onReset}
              className="px-3 py-1.5 text-xs font-mono bg-white hover:bg-zinc-50 text-zinc-800 rounded-lg border border-zinc-300 transition flex items-center gap-1.5 shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset State
            </button>
          )}

          {!activeIncident ? (
            <button
              id="inject-fault-btn"
              onClick={onInjectFault}
              disabled={loadingAction}
              className="px-3.5 py-1.5 text-xs font-semibold font-mono bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>{loadingAction ? "Spawning test_worker..." : "Inject Controlled Fault"}</span>
            </button>
          ) : !activeIncident.remediated ? (
            <button
              id="apply-remediation-btn"
              onClick={() => onRemediate(activeIncident.eventId, activeIncident.selectedAction)}
              disabled={loadingAction}
              className="px-3.5 py-1.5 text-xs font-semibold font-mono bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span>{loadingAction ? "Actuating kernel..." : `Apply Safe Action (${activeIncident.selectedAction})`}</span>
            </button>
          ) : !activeIncident.verified ? (
            <button
              id="verify-recovery-btn"
              onClick={() => onVerify(activeIncident.eventId)}
              disabled={loadingAction}
              className="px-3.5 py-1.5 text-xs font-semibold font-mono bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{loadingAction ? "Verifying..." : "Verify System Recovery"}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold bg-zinc-100 text-zinc-900 border border-zinc-300 rounded-lg">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Lifecycle Complete (Verified)</span>
            </div>
          )}
        </div>
      </div>

      {/* 7-Step Horizontal Flow Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-2.5 text-xs font-mono">
        {/* Step 1: Normal System */}
        <div 
          onClick={() => setActiveStep(1)}
          className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
            activeStep === 1 
              ? "bg-zinc-50 border-zinc-950 ring-1 ring-zinc-950 shadow-xs" 
              : "bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[11px] font-bold">1</span>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Baseline</span>
            </div>
            <div className="text-[11px] font-bold text-zinc-950 mb-0.5">Normal Baseline</div>
            <div className="text-[10px] text-zinc-500 mb-2 truncate">osguardian status</div>

            <div className="space-y-1 text-[11px] pt-1 border-t border-zinc-100">
              <div className="flex justify-between">
                <span className="text-zinc-500">Daemon:</span>
                <span className="text-emerald-700 font-bold">ACTIVE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">CPU:</span>
                <span className="text-zinc-900 font-medium">{cpuVal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">RAM:</span>
                <span className="text-zinc-900 font-medium">{memVal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Risk:</span>
                <span className="text-zinc-900 font-bold">LOW</span>
              </div>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-zinc-200 text-[10px] text-zinc-700 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Steady state
          </div>
        </div>

        {/* Step 2: Introduce Controlled Fault */}
        <div 
          onClick={() => setActiveStep(2)}
          className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
            activeStep === 2 
              ? "bg-zinc-50 border-zinc-950 ring-1 ring-zinc-950 shadow-xs" 
              : "bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[11px] font-bold">2</span>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Fault</span>
            </div>
            <div className="text-[11px] font-bold text-zinc-950 mb-0.5">Controlled Fault</div>
            <div className="text-[10px] text-zinc-500 mb-2 truncate">test_worker / stress</div>

            <div className="space-y-1 text-[10px] p-2 rounded-lg bg-zinc-100/70 border border-zinc-200 text-zinc-800">
              <div className="font-bold text-zinc-950 truncate">PID {targetPid} (worker)</div>
              <div className="flex justify-between">
                <span>CPU Target:</span>
                <span className="font-bold text-red-700">&gt;85% Spike</span>
              </div>
              <div className="flex justify-between">
                <span>RSS Growth:</span>
                <span className="font-bold text-zinc-900">+40MB/tick</span>
              </div>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-zinc-200 text-[10px] text-zinc-700 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Monotonic spike
          </div>
        </div>

        {/* Step 3: Detection & Correlation */}
        <div 
          onClick={() => setActiveStep(3)}
          className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
            activeStep === 3 
              ? "bg-zinc-50 border-zinc-950 ring-1 ring-zinc-950 shadow-xs" 
              : "bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[11px] font-bold">3</span>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Detection</span>
            </div>
            <div className="text-[11px] font-bold text-zinc-950 mb-0.5">Correlated Anomaly</div>
            <div className="text-[10px] text-zinc-500 mb-2 truncate">osguardian events</div>

            <div className="p-2 rounded-lg bg-zinc-100/70 border border-zinc-200 text-[10px] space-y-1 text-zinc-800">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Token:</span>
                <span className="font-bold text-zinc-900 truncate">{activeIncident?.eventId ?? "OG-2026-X"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Target PID:</span>
                <span className="font-bold text-zinc-900">{targetPid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Risk:</span>
                <span className={activeIncident ? "font-bold text-red-700" : "text-zinc-600"}>
                  {activeIncident?.riskLevel ?? "MONITORING"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-zinc-200 text-[10px] text-zinc-700 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600" /> EWMA delta verified
          </div>
        </div>

        {/* Step 4: Impact Analysis */}
        <div 
          onClick={() => setActiveStep(4)}
          className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
            activeStep === 4 
              ? "bg-zinc-50 border-zinc-950 ring-1 ring-zinc-950 shadow-xs" 
              : "bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[11px] font-bold">4</span>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Blast Radius</span>
            </div>
            <div className="text-[11px] font-bold text-zinc-950 mb-0.5">Impact Simulation</div>
            <div className="text-[10px] text-zinc-500 mb-2 truncate">osguardian explain</div>

            <div className="space-y-1 text-[10px] pt-1 border-t border-zinc-100">
              <div className="flex justify-between">
                <span className="text-zinc-500">Terminate:</span>
                <span className="text-red-700 font-medium">HIGH (locks held)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Isolate:</span>
                <span className="text-zinc-800">MEDIUM (pool)</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-zinc-950">Throttle:</span>
                <span className="text-emerald-700">LOW (safest)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Pause:</span>
                <span className="text-zinc-800">MEDIUM (SIGSTOP)</span>
              </div>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-zinc-200 text-[10px] text-zinc-900 font-bold flex items-center gap-1.5">
            <Check className="w-3 h-3 text-zinc-900" /> Selected: THROTTLE
          </div>
        </div>

        {/* Step 5: Safe Remediation */}
        <div 
          onClick={() => setActiveStep(5)}
          className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
            activeStep === 5 
              ? "bg-zinc-50 border-zinc-950 ring-1 ring-zinc-950 shadow-xs" 
              : "bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[11px] font-bold">5</span>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Actuation</span>
            </div>
            <div className="text-[11px] font-bold text-zinc-950 mb-0.5">Kernel Actuation</div>
            <div className="text-[10px] text-zinc-500 mb-2 truncate">cgroups / renice</div>

            <div className="space-y-1 text-[10px] text-zinc-700 pt-1 border-t border-zinc-100">
              <div className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-zinc-900 flex-shrink-0" />
                <span>Bound CPU quota (20%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-zinc-900 flex-shrink-0" />
                <span>Adjust renice +19</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-zinc-900 flex-shrink-0" />
                <span>Retain child sockets</span>
              </div>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-zinc-200 text-[10px] font-medium text-zinc-900">
            {activeIncident?.remediated ? "Action Applied ✓" : "Ready for execution"}
          </div>
        </div>

        {/* Step 6: Closed-Loop Verification */}
        <div 
          onClick={() => setActiveStep(6)}
          className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
            activeStep === 6 
              ? "bg-zinc-50 border-zinc-950 ring-1 ring-zinc-950 shadow-xs" 
              : "bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[11px] font-bold">6</span>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Verify</span>
            </div>
            <div className="text-[11px] font-bold text-zinc-950 mb-0.5">Verification</div>
            <div className="text-[10px] text-zinc-500 mb-2 truncate">osguardian verify</div>

            <div className="space-y-1 text-[10px] pt-1 border-t border-zinc-100">
              <div className="flex justify-between">
                <span className="text-zinc-500">CPU recovered:</span>
                <span className={activeIncident?.verified ? "text-emerald-700 font-bold" : "text-zinc-700"}>
                  {activeIncident?.verified ? "YES" : "AWAITING"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Health:</span>
                <span className="text-zinc-900 font-medium">HEALTHY</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Rollback needed:</span>
                <span className="text-zinc-900 font-medium">NO</span>
              </div>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-zinc-200 text-[10px] text-zinc-900 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Closed-loop check</span>
          </div>
        </div>

        {/* Step 7: Immutable Forensic Report */}
        <div 
          onClick={() => setActiveStep(7)}
          className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
            activeStep === 7 
              ? "bg-zinc-50 border-zinc-950 ring-1 ring-zinc-950 shadow-xs" 
              : "bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[11px] font-bold">7</span>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Report</span>
            </div>
            <div className="text-[11px] font-bold text-zinc-950 mb-0.5">Forensic Audit</div>
            <div className="text-[10px] text-zinc-500 mb-2 truncate">osguardian report</div>

            <div className="p-2 rounded-lg bg-zinc-100/70 border border-zinc-200 text-[10px] space-y-0.5 text-zinc-800">
              <div className="font-bold text-zinc-950">Target: PID {targetPid}</div>
              <div>Action: THROTTLE</div>
              <div className="text-emerald-700 font-bold">Status: RESTORED</div>
              <div className="text-zinc-400 text-[9px]">{activeIncident?.verifiedAt ?? "Auto-committed"}</div>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-zinc-200 text-[10px] text-zinc-500 flex items-center gap-1.5">
            <FileText className="w-3 h-3 text-zinc-700" /> Immutable SQLite audit
          </div>
        </div>
      </div>
    </div>
  );
};
