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

inline const char* process_state_to_string(ProcessState state) noexcept {
    switch (state) {
        case ProcessState::Running:     return "Running";
        case ProcessState::Sleeping:    return "Sleeping";
        case ProcessState::DiskSleep:   return "DiskSleep";
        case ProcessState::Zombie:      return "Zombie";
        case ProcessState::Stopped:     return "Stopped";
        case ProcessState::TracingStop: return "TracingStop";
        case ProcessState::Dead:        return "Dead";
        default:                        return "Unknown";
    }
}

/**
 * @brief Telemetry snapshot for a single process extracted from /proc/[pid].
 */
struct ProcessRecord {
    Pid pid{0};
    Pid ppid{0};
    uint32_t uid{0};
    uint32_t gid{0};
    std::string comm;
    std::string cmdline;
    ProcessState state{ProcessState::Sleeping};

    // CPU ticks from /proc/[pid]/stat
    uint64_t utime_ticks{0};
    uint64_t stime_ticks{0};
    double cpu_usage_pct{0.0};

    // Memory metrics
    uint64_t rss_bytes{0};
    uint64_t vms_bytes{0};
    double mem_usage_pct{0.0};

    uint64_t start_time_ticks{0};
    uint32_t num_threads{1};
    int32_t nice_val{0};

    std::string cgroup_path;
    std::string systemd_unit;
    uint64_t effective_caps{0};
    
    // I/O statistics where accessible
    uint64_t rchar_bytes{0};
    uint64_t wchar_bytes{0};
};

/**
 * @brief System-wide operational telemetry sampled from /proc/stat, meminfo, loadavg.
 */
struct SystemRecord {
    Timestamp sample_time{std::chrono::system_clock::now()};
    
    // Load averages
    double load_1m{0.0};
    double load_5m{0.0};
    double load_15m{0.0};

    // Memory in KiB
    uint64_t mem_total_kb{0};
    uint64_t mem_free_kb{0};
    uint64_t mem_available_kb{0};
    uint64_t mem_cached_kb{0};
    uint64_t mem_buffers_kb{0};

    // Aggregate CPU ticks
    uint64_t cpu_user_ticks{0};
    uint64_t cpu_system_ticks{0};
    uint64_t cpu_idle_ticks{0};
    uint64_t cpu_iowait_ticks{0};
    double cpu_total_pct{0.0};

    // Task counts
    uint32_t total_tasks{0};
    uint32_t running_tasks{0};
    uint32_t thread_count{0};
};

/**
 * @brief Represents an anomaly or deviation detected across time.
 */
enum class AnomalyType {
    CpuSpike,
    MemoryExhaustion,
    RapidForkStorm,
    PrivilegeEscalation,
    ZombieAccumulation,
    IoSaturation,
    UnresponsiveService
};

inline const char* anomaly_type_to_string(AnomalyType t) noexcept {
    switch (t) {
        case AnomalyType::CpuSpike:            return "CPU_SPIKE";
        case AnomalyType::MemoryExhaustion:    return "MEMORY_EXHAUSTION";
        case AnomalyType::RapidForkStorm:      return "RAPID_FORK_STORM";
        case AnomalyType::PrivilegeEscalation: return "PRIVILEGE_ESCALATION";
        case AnomalyType::ZombieAccumulation:  return "ZOMBIE_ACCUMULATION";
        case AnomalyType::IoSaturation:        return "IO_SATURATION";
        case AnomalyType::UnresponsiveService: return "UNRESPONSIVE_SERVICE";
        default:                               return "UNKNOWN_ANOMALY";
    }
}

enum class RiskSeverity {
    Info,
    Low,
    Medium,
    High,
    Critical
};

inline const char* risk_severity_to_string(RiskSeverity s) noexcept {
    switch (s) {
        case RiskSeverity::Info:     return "INFO";
        case RiskSeverity::Low:      return "LOW";
        case RiskSeverity::Medium:   return "MEDIUM";
        case RiskSeverity::High:     return "HIGH";
        case RiskSeverity::Critical: return "CRITICAL";
        default:                     return "UNKNOWN";
    }
}

/**
 * @brief Correlated system event with explainable evidence.
 */
struct CorrelatedEvent {
    std::string event_id;
    Timestamp timestamp{std::chrono::system_clock::now()};
    AnomalyType type{AnomalyType::CpuSpike};
    RiskSeverity severity{RiskSeverity::Medium};
    Pid target_pid{0};
    std::string process_comm;
    std::string systemd_unit;
    double current_value{0.0};
    double baseline_value{0.0};
    double deviation_sigma{0.0};
    std::vector<std::string> evidence_chain;
};

} // namespace osguardian
