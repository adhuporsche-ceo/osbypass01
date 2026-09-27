#pragma once

#include <cstdint>
#include <string>
#include <vector>
#include <chrono>
#include <optional>
#include <unordered_map>

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
    Dead = 'X',
    Unknown = '?'
};

inline const char* process_state_to_str(ProcessState s) noexcept {
    switch (s) {
        case ProcessState::Running: return "Running";
        case ProcessState::Sleeping: return "Sleeping";
        case ProcessState::DiskSleep: return "DiskSleep";
        case ProcessState::Zombie: return "Zombie";
        case ProcessState::Stopped: return "Stopped";
        case ProcessState::TracingStop: return "TracingStop";
        case ProcessState::Dead: return "Dead";
        default: return "Unknown";
    }
}

struct ProcessRecord {
    Pid pid{0};
    Pid ppid{0};
    uint32_t uid{0};
    uint32_t gid{0};
    std::string comm;
    std::string cmdline;
    ProcessState state{ProcessState::Sleeping};

    uint64_t utime_ticks{0};
    uint64_t stime_ticks{0};
    double cpu_usage_pct{0.0};

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
    Timestamp sample_time{std::chrono::system_clock::now()};
    std::string hostname;
    std::string kernel_version;
    std::string os_info;
    uint64_t uptime_seconds{0};
    uint32_t cpu_count{1};
    uint32_t process_count{0};

    double load_1m{0.0};
    double load_5m{0.0};
    double load_15m{0.0};

    uint64_t mem_total_kb{0};
    uint64_t mem_free_kb{0};
    uint64_t mem_available_kb{0};
    uint64_t mem_cached_kb{0};
    uint64_t mem_buffers_kb{0};

    uint64_t cpu_user_ticks{0};
    uint64_t cpu_system_ticks{0};
    uint64_t cpu_idle_ticks{0};
    uint64_t cpu_iowait_ticks{0};
    double cpu_total_pct{0.0};

    uint32_t total_tasks{0};
    uint32_t running_tasks{0};
    uint32_t thread_count{0};
};

enum class RiskSeverity {
    Info,
    Low,
    Medium,
    High,
    Critical
};

inline const char* risk_severity_to_str(RiskSeverity s) noexcept {
    switch (s) {
        case RiskSeverity::Info: return "INFO";
        case RiskSeverity::Low: return "LOW";
        case RiskSeverity::Medium: return "MEDIUM";
        case RiskSeverity::High: return "HIGH";
        case RiskSeverity::Critical: return "CRITICAL";
        default: return "UNKNOWN";
    }
}

enum class RemediationActionType {
    Monitor,
    Throttle,
    Pause,
    Isolate,
    Restart,
    Terminate,
    Kill
};

inline const char* action_type_to_str(RemediationActionType a) noexcept {
    switch (a) {
        case RemediationActionType::Monitor: return "MONITOR";
        case RemediationActionType::Throttle: return "THROTTLE";
        case RemediationActionType::Pause: return "PAUSE";
        case RemediationActionType::Isolate: return "ISOLATE";
        case RemediationActionType::Restart: return "RESTART";
        case RemediationActionType::Terminate: return "TERMINATE";
        case RemediationActionType::Kill: return "KILL";
        default: return "UNKNOWN";
    }
}

struct BlastRadiusImpact {
    Pid target_pid{0};
    std::string process_name;
    std::vector<Pid> children_pids;
    std::string service_unit;
    bool is_critical{false};
    
    // Impact scores for actions
    std::string terminate_impact{"HIGH"};
    std::string isolate_impact{"MEDIUM"};
    std::string throttle_impact{"LOW"};
    std::string pause_impact{"MEDIUM"};
    std::string monitor_impact{"LOW"};
    
    RemediationActionType selected_action{RemediationActionType::Throttle};
    std::string action_reason{"Least disruptive, controls resource usage without killing dependencies."};
};

struct CorrelatedEvent {
    std::string event_id;
    Timestamp timestamp{std::chrono::system_clock::now()};
    std::string anomaly_name{"ANOMALY_DETECTED"};
    RiskSeverity severity{RiskSeverity::High};
    Pid target_pid{0};
    std::string process_comm;
    std::string cpu_growth_desc;
    std::string mem_growth_desc;
    std::string child_growth_desc;
    BlastRadiusImpact blast_radius;
    std::vector<std::string> evidence_chain;
    
    bool remediated{false};
    RemediationActionType applied_action{RemediationActionType::Throttle};
    bool verified{false};
    std::string verification_summary;
};

} // namespace osguardian
