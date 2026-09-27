#pragma once

#include "common/types.hpp"
#include <deque>
#include <unordered_map>
#include <mutex>
#include <memory>

namespace osguardian::state {

/**
 * @brief Statistical metrics tracked with Exponential Weighted Moving Average (EWMA).
 */
struct BaselineMetric {
    double ewma_value{0.0};
    double variance{0.0};
    double min_observed{1e9};
    double max_observed{0.0};
    uint64_t sample_count{0};

    void update(double sample, double alpha = 0.1) noexcept {
        if (sample_count == 0) {
            ewma_value = sample;
            variance = 0.0;
            min_observed = sample;
            max_observed = sample;
            sample_count = 1;
            return;
        }

        double delta = sample - ewma_value;
        ewma_value += alpha * delta;
        variance = (1.0 - alpha) * (variance + alpha * delta * delta);
        if (sample < min_observed) min_observed = sample;
        if (sample > max_observed) max_observed = sample;
        sample_count++;
    }

    [[nodiscard]] double std_dev() const noexcept {
        return (variance > 0.0) ? __builtin_sqrt(variance) : 0.0;
    }

    [[nodiscard]] double z_score(double sample) const noexcept {
        double sd = std_dev();
        if (sd < 0.001) return 0.0;
        return (sample - ewma_value) / sd;
    }
};

/**
 * @brief Per-process behavioral baseline.
 */
struct ProcessBaseline {
    Pid pid{0};
    std::string comm;
    BaselineMetric cpu_pct;
    BaselineMetric memory_bytes;
    uint32_t lifetime_ticks{0};
    bool is_elevated_privilege{false};
};

/**
 * @brief System-wide operational state baseline.
 */
struct SystemBaseline {
    BaselineMetric load_1m;
    BaselineMetric memory_used_pct;
    BaselineMetric cpu_total_pct;
    BaselineMetric active_tasks_count;
    BaselineMetric fork_rate_per_sec;
};

/**
 * @brief Abstract OS State Engine interface.
 * Enforces RAII thread safety and maintains continuous temporal system knowledge.
 */
class IOSStateEngine {
public:
    virtual ~IOSStateEngine() = default;

    /**
     * @brief Ingests an updated telemetry cycle and updates moving baselines.
     * @param sys Current system record.
     * @param procs Active process snapshot table.
     */
    virtual void ingest_sample(
        const SystemRecord& sys,
        const std::unordered_map<Pid, ProcessRecord>& procs
    ) = 0;

    /**
     * @brief Retrieves the current aggregate system baseline.
     */
    virtual SystemBaseline get_system_baseline() const = 0;

    /**
     * @brief Queries baseline metrics for a given process.
     * @return Pointer to process baseline or nullptr if process is unknown/new.
     */
    virtual const ProcessBaseline* get_process_baseline(Pid pid) const = 0;

    /**
     * @brief Computes anomaly deviation for a process relative to its historical baseline.
     * @param pid Process ID.
     * @param current_cpu_pct Measured CPU usage.
     * @param current_mem_bytes Measured RSS memory.
     * @return Z-score (number of standard deviations above mean).
     */
    virtual double compute_process_deviation(
        Pid pid,
        double current_cpu_pct,
        uint64_t current_mem_bytes
    ) const noexcept = 0;

    /**
     * @brief Returns recent historical system snapshots (ring buffer).
     */
    virtual std::vector<SystemRecord> get_recent_history(size_t limit) const = 0;
};

/**
 * @brief Thread-safe Linux OS State Engine implementation with RAII lock guards.
 */
class OSStateEngine final : public IOSStateEngine {
public:
    explicit OSStateEngine(size_t history_capacity = 60) noexcept;
    ~OSStateEngine() noexcept override = default;

    OSStateEngine(const OSStateEngine&) = delete;
    OSStateEngine& operator=(const OSStateEngine&) = delete;
    OSStateEngine(OSStateEngine&&) noexcept = default;
    OSStateEngine& operator=(OSStateEngine&&) noexcept = default;

    void ingest_sample(
        const SystemRecord& sys,
        const std::unordered_map<Pid, ProcessRecord>& procs
    ) override;

    [[nodiscard]] SystemBaseline get_system_baseline() const override;
    [[nodiscard]] const ProcessBaseline* get_process_baseline(Pid pid) const override;
    [[nodiscard]] double compute_process_deviation(
        Pid pid,
        double current_cpu_pct,
        uint64_t current_mem_bytes
    ) const noexcept override;

    [[nodiscard]] std::vector<SystemRecord> get_recent_history(size_t limit) const override;

private:
    mutable std::mutex state_mutex_;
    size_t history_capacity_{60};
    std::deque<SystemRecord> history_ring_;
    
    SystemBaseline system_baseline_;
    std::unordered_map<Pid, ProcessBaseline> process_baselines_;
    uint64_t last_total_tasks_{0};
};

std::unique_ptr<IOSStateEngine> create_state_engine(size_t history_capacity = 60);

} // namespace osguardian::state
