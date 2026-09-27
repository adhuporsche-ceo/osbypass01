import React, { useState, useRef, useEffect } from "react";
import { Terminal as TerminalIcon, CornerDownLeft, Trash2, ArrowUpRight, Copy, Check } from "lucide-react";
import { safeFetchJson } from "../common/apiClient";

interface TerminalConsoleProps {
  onCommandRun?: (cmd: string) => void;
}

export const TerminalConsole: React.FC<TerminalConsoleProps> = () => {
  const [command, setCommand] = useState<string>("osguardian status");
  const [copied, setCopied] = useState<boolean>(false);
  const [history, setHistory] = useState<Array<{ cmd: string; output: string; timestamp: string }>>([
    {
      cmd: "osguardian status",
      output: `[OS Guardian v1.0.0 - Native Autonomous Linux Remediation Engine]
Status:       ACTIVE
CPU:          4.8%
Memory:       32.4% (1328 MB / 4096 MB)
Load:         0.00 (1m), 0.00 (5m), 0.00 (15m)
Processes:    24 active | Threads: 68
Risk Level:   LOW (System stable)

Active Top Tasks:
PID     PPID    USER      MEM(MB)     STATE   COMMAND
------------------------------------------------------------
3946    3935    root      308.6       Sleeping node
525     71      root      126.2       Sleeping apt-get
3921    6       root      80.7        Sleeping npm run dev
3935    3934    root      64.6        Sleeping node
6       1       root      28.0        Sleeping control-plane-agent`,
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [executing, setExecuting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const quickCommands = [
    "osguardian status",
    "osguardian processes",
    "osguardian inspect 1",
    "osguardian impact 1",
    "osguardian --help",
    "sudo dpkg -i osguardian.deb",
    "./osguardian status",
    "systemctl status osguardian"
  ];

  const handleRunCommand = async (cmdToRun: string) => {
    if (!cmdToRun.trim() || executing) return;
    setExecuting(true);

    try {
      const data = await safeFetchJson<any>("/api/terminal/exec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmdToRun })
      });
      setHistory(prev => [
        ...prev,
        {
          cmd: cmdToRun,
          output: data?.output || "(Command executed with exit status 0)",
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } catch (err: any) {
      setHistory(prev => [
        ...prev,
        {
          cmd: cmdToRun,
          output: `Execution error: ${err.message}`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setExecuting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleRunCommand(command);
  };

  const handleCopyHistory = () => {
    const text = history.map(h => `$ ${h.cmd}\n${h.output}`).join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  return (
    <div id="terminal-console-card" className="bg-white border border-zinc-200 rounded-xl shadow-xs flex flex-col h-[480px] overflow-hidden">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-100 border-b border-zinc-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-400 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-400 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-800 inline-block" />
          </div>
          <span className="text-xs font-mono text-zinc-900 font-semibold flex items-center gap-1.5 ml-2">
            <TerminalIcon className="w-3.5 h-3.5 text-zinc-900" />
            root@linux-host:~# /usr/bin/osguardian
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleCopyHistory}
            title="Copy logs"
            className="text-zinc-600 hover:text-zinc-950 transition p-1.5 rounded-md hover:bg-zinc-200 text-xs font-mono flex items-center gap-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setHistory([])}
            title="Clear console"
            className="text-zinc-600 hover:text-zinc-950 transition p-1.5 rounded-md hover:bg-zinc-200 text-xs font-mono"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick command buttons */}
      <div className="flex items-center gap-1.5 px-4 py-2 bg-zinc-50 border-b border-zinc-200 overflow-x-auto flex-shrink-0 text-xs no-scrollbar">
        <span className="text-[10px] text-zinc-500 font-mono flex-shrink-0 uppercase font-semibold">Commands:</span>
        {quickCommands.map((qc) => (
          <button
            key={qc}
            onClick={() => {
              setCommand(qc);
              handleRunCommand(qc);
            }}
            className="px-2.5 py-0.5 rounded-md bg-white hover:bg-zinc-100 border border-zinc-300 text-zinc-900 font-mono text-[11px] whitespace-nowrap transition cursor-pointer shadow-2xs"
          >
            {qc}
          </button>
        ))}
      </div>

      {/* Terminal Log Output Area */}
      <div className="flex-1 overflow-y-auto font-mono text-xs bg-zinc-950 text-zinc-100 p-4 space-y-3">
        {history.map((h, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex items-center gap-2 text-zinc-400 font-semibold">
              <span className="text-white">root@linux-host:~#</span>
              <span className="text-emerald-400">{h.cmd}</span>
              <span className="text-[10px] text-zinc-600 font-normal ml-auto">{h.timestamp}</span>
            </div>
            <pre className="text-zinc-300 bg-zinc-900/90 p-2.5 rounded-lg border border-zinc-800 whitespace-pre-wrap leading-relaxed text-[11px] font-mono">
              {h.output}
            </pre>
          </div>
        ))}
        {executing && (
          <div className="flex items-center gap-2 text-zinc-400 font-mono text-xs py-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Executing command on native Linux kernel subsystem...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Interactive Input Form */}
      <form onSubmit={handleSubmit} className="p-3 bg-zinc-900 border-t border-zinc-800 flex items-center gap-2 flex-shrink-0">
        <span className="font-mono text-xs text-emerald-400 font-bold">#</span>
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="e.g. osguardian status, inspect 1, impact 1, policy"
          className="flex-1 bg-zinc-950 border border-zinc-700/80 rounded-lg px-3 py-1.5 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
        />
        <button
          type="submit"
          disabled={executing}
          className="px-3 py-1.5 bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-mono font-bold rounded-lg transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
        >
          <CornerDownLeft className="w-3.5 h-3.5" />
          <span>Execute</span>
        </button>
      </form>
    </div>
  );
};
