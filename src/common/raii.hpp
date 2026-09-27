#pragma once

#include <unistd.h>
#include <dirent.h>
#include <sys/timerfd.h>
#include <utility>
#include <cstdint>

namespace osguardian::raii {

/**
 * @brief UniqueFd enforces strict RAII lifecycle for native Linux file descriptors.
 * Prevents file descriptor leaks across /proc, /sys, sockets, and timerfds.
 */
class UniqueFd {
public:
    constexpr UniqueFd() noexcept : fd_(-1) {}
    explicit UniqueFd(int fd) noexcept : fd_(fd) {}

    ~UniqueFd() noexcept {
        reset();
    }

    // Move-only semantics (prevent double close)
    UniqueFd(const UniqueFd&) = delete;
    UniqueFd& operator=(const UniqueFd&) = delete;

    UniqueFd(UniqueFd&& other) noexcept : fd_(other.fd_) {
        other.fd_ = -1;
    }

    UniqueFd& operator=(UniqueFd&& other) noexcept {
        if (this != &other) {
            reset(other.fd_);
            other.fd_ = -1;
        }
        return *this;
    }

    [[nodiscard]] int get() const noexcept {
        return fd_;
    }

    [[nodiscard]] bool valid() const noexcept {
        return fd_ >= 0;
    }

    explicit operator bool() const noexcept {
        return valid();
    }

    [[nodiscard]] int release() noexcept {
        int old_fd = fd_;
        fd_ = -1;
        return old_fd;
    }

    void reset(int new_fd = -1) noexcept {
        if (fd_ >= 0) {
            ::close(fd_);
        }
        fd_ = new_fd;
    }

private:
    int fd_{-1};
};

/**
 * @brief UniqueDir enforces strict RAII for POSIX directory streams (DIR*).
 * Used when traversing /proc PID directories.
 */
class UniqueDir {
public:
    constexpr UniqueDir() noexcept : dir_(nullptr) {}
    explicit UniqueDir(DIR* dir) noexcept : dir_(dir) {}

    ~UniqueDir() noexcept {
        reset();
    }

    UniqueDir(const UniqueDir&) = delete;
    UniqueDir& operator=(const UniqueDir&) = delete;

    UniqueDir(UniqueDir&& other) noexcept : dir_(other.dir_) {
        other.dir_ = nullptr;
    }

    UniqueDir& operator=(UniqueDir&& other) noexcept {
        if (this != &other) {
            reset(other.dir_);
            other.dir_ = nullptr;
        }
        return *this;
    }

    [[nodiscard]] DIR* get() const noexcept {
        return dir_;
    }

    [[nodiscard]] bool valid() const noexcept {
        return dir_ != nullptr;
    }

    explicit operator bool() const noexcept {
        return valid();
    }

    void reset(DIR* new_dir = nullptr) noexcept {
        if (dir_ != nullptr) {
            ::closedir(dir_);
        }
        dir_ = new_dir;
    }

private:
    DIR* dir_{nullptr};
};

/**
 * @brief TimerFd manages high-resolution periodic tick timers for telemetry loops
 * without relying on signals or imprecise sleep functions.
 */
class TimerFd {
public:
    TimerFd() noexcept = default;

    static TimerFd create(clockid_t clock_id = CLOCK_MONOTONIC, int flags = TFD_NONBLOCK | TFD_CLOEXEC) noexcept {
        int fd = ::timerfd_create(clock_id, flags);
        return TimerFd(UniqueFd(fd));
    }

    explicit TimerFd(UniqueFd fd) noexcept : ufd_(std::move(fd)) {}

    bool arm_periodic(uint64_t interval_ms) noexcept {
        if (!ufd_) return false;
        struct itimerspec its{};
        its.it_interval.tv_sec = static_cast<time_t>(interval_ms / 1000);
        its.it_interval.tv_nsec = static_cast<long>((interval_ms % 1000) * 1000000ULL);
        its.it_value = its.it_interval;
        return ::timerfd_settime(ufd_.get(), 0, &its, nullptr) == 0;
    }

    // Wait for the next tick. Returns number of expired ticks or 0 on non-block/EAGAIN.
    uint64_t wait_tick() noexcept {
        if (!ufd_) return 0;
        uint64_t expirations = 0;
        ssize_t s = ::read(ufd_.get(), &expirations, sizeof(expirations));
        return (s == sizeof(expirations)) ? expirations : 0;
    }

    [[nodiscard]] int get_fd() const noexcept {
        return ufd_.get();
    }

    [[nodiscard]] bool valid() const noexcept {
        return ufd_.valid();
    }

private:
    UniqueFd ufd_;
};

} // namespace osguardian::raii
