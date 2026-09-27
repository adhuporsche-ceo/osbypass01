#pragma once

#include <unistd.h>
#include <dirent.h>
#include <sys/timerfd.h>
#include <utility>
#include <cstdint>

namespace osguardian::raii {

class UniqueFd {
public:
    constexpr UniqueFd() noexcept : fd_(-1) {}
    explicit UniqueFd(int fd) noexcept : fd_(fd) {}

    ~UniqueFd() noexcept { reset(); }

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

    [[nodiscard]] int get() const noexcept { return fd_; }
    [[nodiscard]] bool valid() const noexcept { return fd_ >= 0; }
    explicit operator bool() const noexcept { return valid(); }

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

class UniqueDir {
public:
    constexpr UniqueDir() noexcept : dir_(nullptr) {}
    explicit UniqueDir(DIR* dir) noexcept : dir_(dir) {}

    ~UniqueDir() noexcept { reset(); }

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

    [[nodiscard]] DIR* get() const noexcept { return dir_; }
    [[nodiscard]] bool valid() const noexcept { return dir_ != nullptr; }
    explicit operator bool() const noexcept { return valid(); }

    void reset(DIR* new_dir = nullptr) noexcept {
        if (dir_ != nullptr) {
            ::closedir(dir_);
        }
        dir_ = new_dir;
    }

private:
    DIR* dir_{nullptr};
};

} // namespace osguardian::raii
