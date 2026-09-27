#pragma once

#include "common/types.hpp"
#include "common/raii.hpp"
#include <unordered_map>
#include <memory>

namespace osguardian::telemetry {

class LinuxTelemetryCollector {
public:
    LinuxTelemetryCollector();
    ~LinuxTelemetryCollector() = default;

    bool sample_system(SystemRecord& out_sys);
    bool sample_process(Pid pid, ProcessRecord& out_proc);
    bool sample_all_processes(std::unordered_map<Pid, ProcessRecord>& out_map);

private:
    uint64_t prev_total_cpu_{0};
    uint64_t prev_idle_cpu_{0};
    std::unordered_map<Pid, uint64_t> prev_proc_ticks_;
    std::chrono::steady_clock::time_point last_sample_time_;
};

} // namespace osguardian::telemetry
