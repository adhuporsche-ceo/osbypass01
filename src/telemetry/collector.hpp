#pragma once

#include "common/types.hpp"
#include "common/raii.hpp"
#include <unordered_map>
#include <memory>
#include <string_view>
#include <span>

namespace osguardian::telemetry {

/**
 * @brief Abstract interface for OS Telemetry Collection.
 * Ensures strict RAII management over Linux pseudo-filesystems (/proc, /sys).
 */
class ITelemetryCollector {
public:
    virtual ~ITelemetryCollector() = default;

    /**
     * @brief Ingests aggregate host metrics from /proc/stat, /proc/meminfo, /proc/loadavg.
     * Guaranteed zero dynamic heap allocation in execution loop.
     * @param out_sys Target structure populated with normalized metrics.
     * @return true if all primary pseudo-files were opened and parsed cleanly.
     */
    virtual bool sample_system(SystemRecord& out_sys) noexcept = 0;

    /**
     * @brief Ingests task-level metrics for a single PID from /proc/[pid]/stat, status, cmdline.
     * @param pid Target process identifier.
     * @param out_proc Target structure populated with task data.
     * @return true if the process exists and was readable; false if process exited (ENOENT).
     */
    virtual bool sample_process(Pid pid, ProcessRecord& out_proc) noexcept = 0;

    /**
     * @brief Scans the active process table across /proc and returns active snapshots.
     * Safely ignores transient processes that exit during iteration.
     * @param out_map Map populated with active process records.
     * @return true on successful directory traversal.
     */
    virtual bool sample_all_processes(std::unordered_map<Pid, ProcessRecord>& out_map) = 0;
};

/**
 * @brief Native Linux Telemetry Collector implementation.
 * Encapsulates static scratch buffers to avoid repeated heap allocation on every tick.
 */
class LinuxTelemetryCollector final : public ITelemetryCollector {
public:
    LinuxTelemetryCollector() noexcept;
    ~LinuxTelemetryCollector() noexcept override = default;

    // Non-copyable, movable (RAII resource holder)
    LinuxTelemetryCollector(const LinuxTelemetryCollector&) = delete;
    LinuxTelemetryCollector& operator=(const LinuxTelemetryCollector&) = delete;
    LinuxTelemetryCollector(LinuxTelemetryCollector&&) noexcept = default;
    LinuxTelemetryCollector& operator=(LinuxTelemetryCollector&&) noexcept = default;

    bool sample_system(SystemRecord& out_sys) noexcept override;
    bool sample_process(Pid pid, ProcessRecord& out_proc) noexcept override;
    bool sample_all_processes(std::unordered_map<Pid, ProcessRecord>& out_map) override;

    /**
     * @brief Helper to parse Linux /proc/[pid]/cmdline preserving null-byte argument splits.
     */
    static std::string read_cmdline_sanitized(int proc_dir_fd) noexcept;

    /**
     * @brief Extracts cgroup v2 path or systemd unit name from /proc/[pid]/cgroup.
     */
    static std::string read_cgroup_unit(int proc_dir_fd) noexcept;

private:
    // Fixed stack/static scratch buffer capacity for zero-allocation proc reads
    static constexpr size_t kScratchBufferSize = 8192;
    char scratch_buffer_[kScratchBufferSize];

    // Previous tick tick counts for delta calculations
    uint64_t prev_total_cpu_ticks_{0};
    uint64_t prev_idle_cpu_ticks_{0};
    std::unordered_map<Pid, std::pair<uint64_t, uint64_t>> prev_proc_ticks_; // pid -> (utime, stime)
};

/**
 * @brief Factory function for creating the Linux telemetry collector instance.
 */
std::unique_ptr<ITelemetryCollector> create_telemetry_collector();

} // namespace osguardian::telemetry
