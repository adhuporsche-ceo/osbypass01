# OS Guardian: System Architecture & C++ Technical Specification

**Version:** 1.0.0-RFC  
**Target Platform:** Linux 4.19+ (x86_64, aarch64)  
**Implementation Standard:** C++20 / POSIX  
**Classification:** Mission-Critical System Software / Autonomous OS Remediation  

---

## 1. Architectural Philosophy & Daemon/CLI Split

OS Guardian rejects the architectural anti-pattern of running heavy, ad-hoc monitoring routines inside interactive CLI invocations. Continuous observation, temporal baseline derivation, and blast-radius tracking require uninterrupted state memory.

```
+-----------------------------------------------------------------------------+
|                                LINUX HOST                                   |
|                                                                             |
|   +---------------------------------------------------------------------+   |
|   |                      osguardiand (System Daemon)                    |   |
|   |                                                                     |   |
|   |  - Runs as systemd service (Type=notify, AmbientCapabilities=...)   |   |
|   |  - Continuous tick (default 1000ms) via timerfd_create(2)           |   |
|   |  - Zero dynamic heap allocation in hot telemetry loop               |   |
|   |  - State persistence, process DAG maintenance, EWMA baselines       |   |
|   |  - Autonomous remediation gatekeeper (enforcing /etc policy)        |   |
|   |  - Listens on UNIX domain socket: /run/osguardian/osguardian.sock   |   |
|   +----------------------------------▲----------------------------------+   |
|                                      │                                      |
|               UNIX Domain Socket IPC │ (SO_PEERCRED authentication)         |
|               Framed Binary Protocol │                                      |
|                                      │                                      |
|   +----------------------------------▼----------------------------------+   |
|   |                       osguardian (Admin CLI)                        |   |
|   |                                                                     |   |
|   |  - Ephemeral user-space tool (/usr/bin/osguardian)                 |   |
|   |  - Subcommands: status, monitor, inspect, impact, remediate, etc.   |   |
|   |  - Connects to daemon socket with strict timeout                    |   |
|   |  - Fallback mode: If daemon is offline, can run direct read-only    |   |
|   |    inspection via direct /proc scanning (restricted capabilities)   |   |
|   |  - Human tabular output or scriptable --json stream                 |   |
|   +---------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------+
```

### Why the Split is Mandatory

1. **State Continuity**: A single measurement of CPU or memory is meaningless. Detecting an abnormal fork-storm or runaway memory leak requires a temporal window of past measurements ($T_{-30s} \to T_0$). The CLI is ephemeral; the daemon maintains unbroken continuity.
2. **Blast-Radius Invariants**: Evaluating the downstream impact of terminating a process requires knowledge of process lifetime, historical socket associations, child tree depth, and service unit bindings. This DAG is continuously updated as `fork(2)` and `exit(2)` events occur.
3. **Privilege Isolation & Audit Trail**: The daemon operates with defined system capabilities (`CAP_SYS_PTRACE`, `CAP_KILL`, `CAP_SYS_NICE`). The CLI can be executed by operators with restricted access; authorization is verified by the daemon at connection time using kernel peer credentials.

---

## 2. IPC Architecture & Security Specification

### 2.1 Transport Layer
- **Socket Family:** `AF_UNIX`
- **Socket Type:** `SOCK_STREAM` (Connection-oriented, sequenced, reliable)
- **Path:** `/run/osguardian/osguardian.sock`
- **Filesystem Permissions:** `0660`
- **Ownership:** `root:osguardian`

### 2.2 Peer Credential Verification (SO_PEERCRED)
Upon accepting a connection, the daemon retrieves the kernel-attested credentials of the client process:

```cpp
struct ucred cred{};
socklen_t len = sizeof(cred);
if (getsockopt(client_fd, SOL_SOCKET, SO_PEERCRED, &cred, &len) == -1) {
    // Abort connection: unable to verify caller identity
    close(client_fd);
    return;
}
// Enforce RBAC:
// cred.uid == 0: SuperAdmin (full remediation allowed)
// cred.gid in osguardian group: Read-only inspection allowed
```

### 2.3 Binary Wire Framing Protocol
Every IPC message consists of a fixed-size 16-byte header followed by a variable-length payload.

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|       Magic (0x4F534744)      |          Version (1)          |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|          Message Type         |            Flags              |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                         Sequence ID                           |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                        Payload Length                         |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                                                               |
|                        Payload (JSON)                         |
|                                                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

#### Message Types (`enum class MsgType : uint16_t`)
- `0x0001` : `REQ_STATUS`
- `0x0002` : `RESP_STATUS`
- `0x0003` : `REQ_PROCESS_LIST`
- `0x0004` : `RESP_PROCESS_LIST`
- `0x0005` : `REQ_INSPECT_PID`
- `0x0006` : `RESP_INSPECT_PID`
- `0x0007` : `REQ_IMPACT_ANALYSIS`
- `0x0008` : `RESP_IMPACT_ANALYSIS`
- `0x0009` : `REQ_SIMULATE_ACTION`
- `0x000A` : `RESP_SIMULATE_ACTION`
- `0x000B` : `REQ_EXECUTE_REMEDIATION`
- `0x000C` : `RESP_EXECUTE_REMEDIATION`
- `0x000D` : `REQ_FORENSIC_EVENT`
- `0x000E` : `RESP_FORENSIC_EVENT`
- `0xFFFF` : `RESP_ERROR`

---

## 3. C++20 Module Interfaces & Type System

Below are the normative interface definitions for the core subsystems.

### 3.1 Common Types (`src/common/types.hpp`)

```cpp
#pragma once
#include <cstdint>
#include <string>
#include <vector>
#include <chrono>
#include <optional>

namespace osguardian {

using Pid = int32_t;
using Timestamp = std::chrono::time_point<std::chrono::system_clock>;

enum class ProcessState : char {
    Running = 'R',
    Sleeping = 'S',
    DiskSleep = 'D',
    Zombie = 'Z',
    Stopped = 'T',
    TracingStop = 't',
    Dead = 'X'
};

struct ProcessRecord {
    Pid pid{0};
    Pid ppid{0};
    uint32_t uid{0};
    uint32_t gid{0};
    std::string comm;
    std::string cmdline;
    ProcessState state{ProcessState::Sleeping};
    
    // CPU metrics (clock ticks)
    uint64_t utime_ticks{0};
    uint64_t stime_ticks{0};
    double cpu_usage_pct{0.0};
    
    // Memory metrics (bytes)
    uint64_t rss_bytes{0};
    uint64_t vms_bytes{0};
    double mem_usage_pct{0.0};
    
    uint64_t start_time_ticks{0};
    uint32_t num_threads{1};
    int32_t nice_val{0};
    
    std::string cgroup_path;
    std::string systemd_unit;
    uint64_t effective_caps{0};
};

struct SystemRecord {
    Timestamp sample_time;
    double load_1m{0.0};
    double load_5m{0.0};
    double load_15m{0.0};
    
    uint64_t mem_total_kb{0};
    uint64_t mem_free_kb{0};
    uint64_t mem_available_kb{0};
    uint64_t mem_cached_kb{0};
    uint64_t mem_buffers_kb{0};
    
    uint64_t cpu_total_ticks{0};
    uint64_t cpu_idle_ticks{0};
    uint64_t cpu_iowait_ticks{0};
    
    uint32_t total_tasks{0};
    uint32_t running_tasks{0};
};

enum class RiskLevel {
    None,
    Low,
    Medium,
    High,
    Critical
};

struct RiskAssessment {
    RiskLevel level{RiskLevel::None};
    uint32_t score{0}; // 0 to 100 scale
    std::vector<std::string> contributing_factors;
    double anomaly_score{0.0};
    double resource_pressure_score{0.0};
    double privilege_score{0.0};
    double blast_radius_score{0.0};
};

enum class RemediationActionType {
    Allow,
    Monitor,
    Alert,
    ThrottleNice,
    ThrottleCgroup,
    PauseSigstop,
    ResumeSigcont,
    RestartService,
    TerminateSigterm,
    KillSigkill
};

struct ActionOption {
    RemediationActionType action;
    bool is_reversible;
    uint32_t disruption_index; // 0 (none) to 100 (complete outage)
    std::string rationale;
    std::vector<Pid> affected_pids;
};

struct BlastRadius {
    Pid target_pid;
    std::string target_unit;
    std::vector<Pid> descendant_pids;
    std::vector<std::string> impacted_services;
    bool is_critical_system_process;
    uint32_t estimated_blast_score; // 0 - 100
    std::string risk_summary;
};

struct Incident {
    std::string event_id; // e.g. EVENT-20260919-001
    Timestamp detected_at;
    Pid target_pid;
    ProcessRecord process_snapshot;
    RiskAssessment risk;
    BlastRadius blast;
    std::vector<ActionOption> simulated_actions;
    std::optional<RemediationActionType> applied_action;
    bool verification_succeeded{false};
    std::string forensic_summary;
};

} // namespace osguardian
```

---

### 3.2 Telemetry Collector Interface (`src/telemetry/collector.hpp`)

```cpp
#pragma once
#include "common/types.hpp"
#include <unordered_map>
#include <memory>

namespace osguardian::telemetry {

class ITelemetryCollector {
public:
    virtual ~ITelemetryCollector() = default;
    
    // Low-level zero-allocation /proc reader
    virtual bool sample_system(SystemRecord& out_sys) = 0;
    virtual bool sample_process(Pid pid, ProcessRecord& out_proc) = 0;
    
    // Full snapshot of current running tasks
    virtual bool sample_all_processes(std::unordered_map<Pid, ProcessRecord>& out_map) = 0;
};

std::unique_ptr<ITelemetryCollector> create_linux_telemetry_collector();

} // namespace osguardian::telemetry
```

---

### 3.3 Process Dependency Graph Interface (`src/process/process_tree.hpp`)

```cpp
#pragma once
#include "common/types.hpp"
#include <unordered_map>
#include <vector>
#include <memory>

namespace osguardian::process {

struct ProcessNode {
    ProcessRecord info;
    std::vector<Pid> children;
    std::vector<Pid> pgrp_members;
};

class IProcessGraph {
public:
    virtual ~IProcessGraph() = default;
    
    // Ingests updated telemetry map and rebuilds the DAG
    virtual void update_topology(const std::unordered_map<Pid, ProcessRecord>& proc_map) = 0;
    
    virtual const ProcessNode* find_node(Pid pid) const = 0;
    virtual std::vector<Pid> get_all_descendants(Pid pid) const = 0;
    virtual std::vector<Pid> get_ancestor_chain(Pid pid) const = 0;
    virtual std::string resolve_service_unit(Pid pid) const = 0;
};

std::unique_ptr<IProcessGraph> create_process_graph();

} // namespace osguardian::process
```

---

### 3.4 Impact / Blast-Radius Analyzer Interface (`src/impact/blast_radius.hpp`)

```cpp
#pragma once
#include "common/types.hpp"
#include "process/process_tree.hpp"
#include <memory>

namespace osguardian::impact {

class IImpactAnalyzer {
public:
    virtual ~IImpactAnalyzer() = default;
    
    // Evaluates the blast radius if an intervention is staged on target_pid
    virtual BlastRadius evaluate_blast_radius(
        Pid target_pid,
        const process::IProcessGraph& graph,
        const SystemRecord& current_system_state
    ) = 0;
};

std::unique_ptr<IImpactAnalyzer> create_impact_analyzer();

} // namespace osguardian::impact
```

---

### 3.5 Policy Engine Interface (`src/policy/policy_engine.hpp`)

```cpp
#pragma once
#include "common/types.hpp"
#include <string>
#include <memory>

namespace osguardian::policy {

enum class PolicyVerdict {
    Approved,
    Forbidden,
    RequiresHumanAuthorization
};

struct PolicyDecision {
    PolicyVerdict verdict;
    std::string matched_rule_id;
    std::string explanation;
    RemediationActionType permitted_action;
};

class IPolicyEngine {
public:
    virtual ~IPolicyEngine() = default;
    
    virtual bool load_policy(const std::string& config_path) = 0;
    virtual bool is_protected(Pid pid, const std::string& comm, const std::string& unit) const = 0;
    
    virtual PolicyDecision authorize_action(
        const Incident& incident,
        RemediationActionType requested_action
    ) const = 0;
};

std::unique_ptr<IPolicyEngine> create_policy_engine();

} // namespace osguardian::policy
```

---

### 3.6 Remediation & Verification Interfaces (`src/remediation/engine.hpp`)

```cpp
#pragma once
#include "common/types.hpp"
#include "telemetry/collector.hpp"
#include <memory>

namespace osguardian::remediation {

struct ExecutionResult {
    bool executed{false};
    int error_code{0};
    std::string error_message;
    Timestamp executed_at;
};

class IRemediationEngine {
public:
    virtual ~IRemediationEngine() = default;
    
    // Applies native Linux actions (SIGSTOP, renice, cgroup throttle, SIGTERM)
    virtual ExecutionResult execute_action(
        Pid target_pid,
        RemediationActionType action
    ) = 0;
    
    // Reverts an action if verification detects escalation or error
    virtual ExecutionResult rollback_action(
        Pid target_pid,
        RemediationActionType original_action
    ) = 0;
};

class IVerificationEngine {
public:
    virtual ~IVerificationEngine() = default;
    
    // Observes system deltas after T+window_ms to confirm stabilization
    virtual bool verify_recovery(
        Pid target_pid,
        RemediationActionType action,
        telemetry::ITelemetryCollector& collector,
        uint32_t window_ms
    ) = 0;
};

std::unique_ptr<IRemediationEngine> create_remediation_engine();
std::unique_ptr<IVerificationEngine> create_verification_engine();

} // namespace osguardian::remediation
```

---

### 3.7 Forensic Engine Interface (`src/forensic/forensic_log.hpp`)

```cpp
#pragma once
#include "common/types.hpp"
#include <string>
#include <vector>
#include <memory>

namespace osguardian::forensic {

class IForensicEngine {
public:
    virtual ~IForensicEngine() = default;
    
    virtual bool initialize(const std::string& db_path, const std::string& audit_log_path) = 0;
    virtual bool record_incident(const Incident& incident) = 0;
    virtual std::optional<Incident> query_incident(const std::string& event_id) = 0;
    virtual std::vector<Incident> list_recent_incidents(size_t limit) = 0;
};

std::unique_ptr<IForensicEngine> create_forensic_engine();

} // namespace osguardian::forensic
```

---

### 3.8 IPC Server & Client Interfaces (`src/ipc/ipc.hpp`)

```cpp
#pragma once
#include "common/types.hpp"
#include <functional>
#include <string>
#include <memory>

namespace osguardian::ipc {

#pragma pack(push, 1)
struct IpcHeader {
    uint32_t magic{0x4F534744}; // "OSGD"
    uint16_t version{1};
    uint16_t msg_type{0};
    uint32_t sequence_id{0};
    uint32_t payload_len{0};
};
#pragma pack(pop)

using RequestHandler = std::function<std::string(uint16_t msg_type, const std::string& payload, uint32_t client_uid)>;

class IIpcServer {
public:
    virtual ~IIpcServer() = default;
    
    virtual bool bind_and_listen(const std::string& socket_path) = 0;
    virtual void register_handler(uint16_t msg_type, RequestHandler handler) = 0;
    virtual void poll_events(int timeout_ms) = 0;
    virtual void stop() = 0;
};

class IIpcClient {
public:
    virtual ~IIpcClient() = default;
    
    virtual bool connect_to_daemon(const std::string& socket_path, int timeout_ms) = 0;
    virtual bool send_request(uint16_t msg_type, const std::string& json_payload, std::string& out_response) = 0;
    virtual void disconnect() = 0;
};

std::unique_ptr<IIpcServer> create_ipc_server();
std::unique_ptr<IIpcClient> create_ipc_client();

} // namespace osguardian::ipc
```

---

## 4. Failure Modes & Edge Case Containment Matrix

| Failure Mode | Root Cause | Guardian Containment Behavior |
| :--- | :--- | :--- |
| **PID Race Condition** | Target process exits after inspection; another process inherits PID. | The engine verifies `/proc/[pid]/stat` `starttime` ticks immediately prior to emitting `kill(2)` or cgroup updates. If start-time differs, action is aborted with `ERR_PID_RECYCLED`. |
| **Daemon Abrupt Crash** | Kernel OOM killer or unhandled signal terminates `osguardiand`. | Systemd restarts daemon with `Restart=always`, `RestartSec=2s`. Any suspended process (`SIGSTOP`) left stranded is resumed during daemon startup recovery scan. |
| **Telemetry Choke** | High system load causes `/proc` reading latency to exceed tick deadline. | Telemetry loop uses non-blocking reads; if tick deadline is breached, sampling is skipped, autonomous actions are gated (`FAIL_SAFE_PASSIVE`), and warning is recorded. |
| **Tampered / Corrupted Socket** | Malicious local actor floods `/run/osguardian/osguardian.sock`. | Server applies `SO_PEERCRED` filtering immediately on `accept4(2)`, enforces rate limiting per UID, and drops malformed frames without heap reallocation. |
| **Zombie / Defunct Process** | Remediated process terminated but un-reaped by its parent. | Verification engine tracks process state `'Z'` and alerts parent process or system supervisor rather than issuing redundant kills. |

---

## 5. Summary & Verification

This architecture document is placed in the project repository at `docs/ARCHITECTURE.md` to serve as the definitive specification for the C++ implementation.
