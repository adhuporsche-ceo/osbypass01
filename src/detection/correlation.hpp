#pragma once

#include "common/types.hpp"
#include "state/os_state.hpp"
#include <vector>
#include <deque>
#include <memory>
#include <mutex>

namespace osguardian::detection {

/**
 * @brief Configuration thresholds for multi-signal correlation.
 */
struct CorrelationConfig {
    double cpu_anomaly_z_score{3.0};       // Number of sigmas above baseline to trigger anomaly
    double cpu_absolute_min_pct{50.0};      // Must also exceed minimum absolute CPU to avoid small jitter
    double memory_growth_rate_mb_sec{50.0}; // Rapid memory allocation rate
    uint32_t fork_storm_threshold_sec{40};  // PIDs spawned per second threshold
    uint32_t zombie_threshold_count{15};    // Number of un-reaped zombies
    uint32_t temporal_window_sec{30};       // Window to correlate events together
};

/**
 * @brief Abstract Event Correlation Engine interface.
 * Correlates raw state metrics into explainable incident events.
 */
class IEventCorrelationEngine {
public:
    virtual ~IEventCorrelationEngine() = default;

    /**
     * @brief Evaluates current system and process metrics against historical baselines.
     * Generates correlated events with an explicit evidence chain.
     * @param sys Current system telemetry.
     * @param procs Active process map.
     * @param state_engine Reference to state engine containing historical baselines.
     * @return List of newly detected correlated events for this cycle.
     */
    virtual std::vector<CorrelatedEvent> evaluate_and_correlate(
        const SystemRecord& sys,
        const std::unordered_map<Pid, ProcessRecord>& procs,
        const state::IOSStateEngine& state_engine
    ) = 0;

    /**
     * @brief Retrieves active incidents within the recent correlation window.
     */
    virtual std::vector<CorrelatedEvent> get_recent_events(size_t limit) const = 0;

    /**
     * @brief Clears or acknowledges an event by ID.
     */
    virtual bool acknowledge_event(const std::string& event_id) = 0;
};

/**
 * @brief Multi-signal Linux Event Correlation Engine implementation.
 * Ensures thread-safe event queuing and RAII mutex management.
 */
class EventCorrelationEngine final : public IEventCorrelationEngine {
public:
    explicit EventCorrelationEngine(CorrelationConfig config = {}) noexcept;
    ~EventCorrelationEngine() noexcept override = default;

    EventCorrelationEngine(const EventCorrelationEngine&) = delete;
    EventCorrelationEngine& operator=(const EventCorrelationEngine&) = delete;
    EventCorrelationEngine(EventCorrelationEngine&&) noexcept = default;
    EventCorrelationEngine& operator=(EventCorrelationEngine&&) noexcept = default;

    std::vector<CorrelatedEvent> evaluate_and_correlate(
        const SystemRecord& sys,
        const std::unordered_map<Pid, ProcessRecord>& procs,
        const state::IOSStateEngine& state_engine
    ) override;

    [[nodiscard]] std::vector<CorrelatedEvent> get_recent_events(size_t limit) const override;
    bool acknowledge_event(const std::string& event_id) override;

private:
    CorrelationConfig config_;
    mutable std::mutex event_mutex_;
    std::deque<CorrelatedEvent> active_events_;
    uint64_t event_counter_{1000};

    std::string generate_event_id() noexcept;

    // Helper detectors
    void check_process_cpu_anomalies(
        const std::unordered_map<Pid, ProcessRecord>& procs,
        const state::IOSStateEngine& state_engine,
        std::vector<CorrelatedEvent>& out_events
    );

    void check_memory_exhaustion(
        const SystemRecord& sys,
        const std::unordered_map<Pid, ProcessRecord>& procs,
        std::vector<CorrelatedEvent>& out_events
    );

    void check_zombie_accumulation(
        const std::unordered_map<Pid, ProcessRecord>& procs,
        std::vector<CorrelatedEvent>& out_events
    );
};

std::unique_ptr<IEventCorrelationEngine> create_correlation_engine(CorrelationConfig config = {});

} // namespace osguardian::detection
