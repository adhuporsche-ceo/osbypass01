#include "telemetry/collector.hpp"
#include <fstream>
#include <sstream>
#include <dirent.h>
#include <unistd.h>
#include <cstring>
#include <cstdlib>
#include <sys/utsname.h>
#include <thread>
#include <chrono>

namespace osguardian::telemetry {

LinuxTelemetryCollector::LinuxTelemetryCollector() {
    last_sample_time_ = std::chrono::steady_clock::now();
}

bool LinuxTelemetryCollector::sample_system(SystemRecord& out_sys) {
    out_sys.sample_time = std::chrono::system_clock::now();

    // 1. Hostname
    char hbuf[256] = {0};
    if (gethostname(hbuf, sizeof(hbuf) - 1) == 0 && hbuf[0] != '\0') {
        out_sys.hostname = hbuf;
    } else {
        std::ifstream host_file("/proc/sys/kernel/hostname");
        if (host_file.is_open()) {
            host_file >> out_sys.hostname;
        } else {
            out_sys.hostname = "localhost";
        }
    }

    // 2. Kernel Version (via POSIX uname)
    struct utsname uts;
    if (uname(&uts) == 0) {
        out_sys.kernel_version = std::string(uts.sysname) + " " + uts.release + " (" + uts.machine + ")";
    } else {
        out_sys.kernel_version = "Linux (unknown)";
    }

    // 3. OS Information (parse /etc/os-release)
    std::ifstream os_file("/etc/os-release");
    if (os_file.is_open()) {
        std::string line;
        while (std::getline(os_file, line)) {
            if (line.rfind("PRETTY_NAME=", 0) == 0) {
                std::string val = line.substr(12);
                if (!val.empty() && (val.front() == '"' || val.front() == '\'')) {
                    val = val.substr(1);
                }
                if (!val.empty() && (val.back() == '"' || val.back() == '\'')) {
                    val.pop_back();
                }
                out_sys.os_info = val;
                break;
            }
        }
    }
    if (out_sys.os_info.empty()) {
        std::ifstream issue_file("/etc/issue");
        if (issue_file.is_open()) {
            std::getline(issue_file, out_sys.os_info);
            // remove escape characters like \n \l
            size_t slash = out_sys.os_info.find('\\');
            if (slash != std::string::npos) {
                out_sys.os_info = out_sys.os_info.substr(0, slash);
            }
        }
    }
    if (out_sys.os_info.empty()) {
        out_sys.os_info = "Linux GNU/Linux";
    }

    // 4. Uptime (from /proc/uptime)
    std::ifstream uptime_file("/proc/uptime");
    if (uptime_file.is_open()) {
        double uptime_sec = 0.0;
        if (uptime_file >> uptime_sec) {
            out_sys.uptime_seconds = static_cast<uint64_t>(uptime_sec);
        }
    }

    // 5. CPU Count (Online Processors)
    long nprocs = sysconf(_SC_NPROCESSORS_ONLN);
    out_sys.cpu_count = (nprocs > 0) ? static_cast<uint32_t>(nprocs) : 1;

    // 6. /proc/loadavg
    std::ifstream loadavg_file("/proc/loadavg");
    if (loadavg_file.is_open()) {
        loadavg_file >> out_sys.load_1m >> out_sys.load_5m >> out_sys.load_15m;
    }

    // 7. /proc/meminfo (Total, Available, Free, Buffers, Cached)
    std::ifstream meminfo_file("/proc/meminfo");
    if (meminfo_file.is_open()) {
        std::string line;
        while (std::getline(meminfo_file, line)) {
            char key[64];
            uint64_t val = 0;
            if (sscanf(line.c_str(), "%63[^:]: %lu kB", key, &val) == 2) {
                if (strcmp(key, "MemTotal") == 0) out_sys.mem_total_kb = val;
                else if (strcmp(key, "MemFree") == 0) out_sys.mem_free_kb = val;
                else if (strcmp(key, "MemAvailable") == 0) out_sys.mem_available_kb = val;
                else if (strcmp(key, "Buffers") == 0) out_sys.mem_buffers_kb = val;
                else if (strcmp(key, "Cached") == 0) out_sys.mem_cached_kb = val;
            }
        }
    }

    // 8. Process Count (actual scan of numeric /proc/[0-9]+ directories)
    uint32_t pcount = 0;
    DIR* proc_dir = opendir("/proc");
    if (proc_dir) {
        struct dirent* de = nullptr;
        while ((de = readdir(proc_dir)) != nullptr) {
            if (de->d_type == DT_DIR || de->d_type == DT_UNKNOWN) {
                char* endptr = nullptr;
                long pid_val = strtol(de->d_name, &endptr, 10);
                if (*endptr == '\0' && pid_val > 0) {
                    pcount++;
                }
            }
        }
        closedir(proc_dir);
    }
    out_sys.process_count = pcount;

    // 9. /proc/stat (Accurate Differential CPU Calculation)
    auto read_cpu_ticks = [](uint64_t& out_total, uint64_t& out_idle, uint64_t& u, uint64_t& s, uint64_t& idl, uint64_t& iow) -> bool {
        std::ifstream sf("/proc/stat");
        if (!sf.is_open()) return false;
        std::string line;
        if (std::getline(sf, line) && line.rfind("cpu ", 0) == 0) {
            uint64_t user=0, nice=0, system=0, idle=0, iowait=0, irq=0, softirq=0, steal=0;
            sscanf(line.c_str(), "cpu %lu %lu %lu %lu %lu %lu %lu %lu",
                   &user, &nice, &system, &idle, &iowait, &irq, &softirq, &steal);
            out_total = user + nice + system + idle + iowait + irq + softirq + steal;
            out_idle = idle + iowait;
            u = user;
            s = system;
            idl = idle;
            iow = iowait;
            return true;
        }
        return false;
    };

    uint64_t cur_total = 0, cur_idle = 0;
    uint64_t u=0, s=0, idl=0, iow=0;
    if (read_cpu_ticks(cur_total, cur_idle, u, s, idl, iow)) {
        if (prev_total_cpu_ > 0 && cur_total > prev_total_cpu_) {
            uint64_t diff_total = cur_total - prev_total_cpu_;
            uint64_t diff_idle = cur_idle - prev_idle_cpu_;
            if (diff_total > 0) {
                double active_ratio = 1.0 - (static_cast<double>(diff_idle) / static_cast<double>(diff_total));
                out_sys.cpu_total_pct = active_ratio * 100.0;
            }
        } else {
            // Sample over a tiny 50ms window to give real instant CPU% for standalone CLI runs
            std::this_thread::sleep_for(std::chrono::milliseconds(50));
            uint64_t t2 = 0, idl2 = 0, u2=0, s2=0, id2=0, iw2=0;
            if (read_cpu_ticks(t2, idl2, u2, s2, id2, iw2) && t2 > cur_total) {
                uint64_t diff_total = t2 - cur_total;
                uint64_t diff_idle = idl2 - cur_idle;
                double active_ratio = 1.0 - (static_cast<double>(diff_idle) / static_cast<double>(diff_total));
                out_sys.cpu_total_pct = active_ratio * 100.0;
                cur_total = t2;
                cur_idle = idl2;
            } else if (cur_total > 0) {
                // Fallback to cumulative uptime average
                out_sys.cpu_total_pct = (1.0 - (static_cast<double>(cur_idle) / static_cast<double>(cur_total))) * 100.0;
            }
        }

        if (out_sys.cpu_total_pct < 0.0) out_sys.cpu_total_pct = 0.0;
        if (out_sys.cpu_total_pct > 100.0) out_sys.cpu_total_pct = 100.0;

        prev_total_cpu_ = cur_total;
        prev_idle_cpu_ = cur_idle;
        out_sys.cpu_user_ticks = u;
        out_sys.cpu_system_ticks = s;
        out_sys.cpu_idle_ticks = idl;
        out_sys.cpu_iowait_ticks = iow;
    }

    return true;
}

bool LinuxTelemetryCollector::sample_process(Pid pid, ProcessRecord& out_proc) {
    out_proc.pid = pid;

    // 1. Read /proc/[pid]/stat
    std::string stat_path = "/proc/" + std::to_string(pid) + "/stat";
    std::ifstream stat_file(stat_path);
    if (!stat_file.is_open()) {
        return false;
    }

    std::string line;
    if (!std::getline(stat_file, line)) {
        return false;
    }

    // Process comm is enclosed in parentheses: e.g. 1234 (node) S 1 1234 ...
    size_t open_paren = line.find('(');
    size_t close_paren = line.rfind(')');
    if (open_paren != std::string::npos && close_paren != std::string::npos && close_paren > open_paren) {
        out_proc.comm = line.substr(open_paren + 1, close_paren - open_paren - 1);
        std::string rest = line.substr(close_paren + 2);
        std::istringstream iss(rest);
        char state_char = 'S';
        Pid ppid = 0;
        int pgrp=0, session=0, tty_nr=0, tpgid=0;
        unsigned int flags=0;
        uint64_t minflt=0, cminflt=0, majflt=0, cmajflt=0;
        uint64_t utime=0, stime=0;
        int64_t cutime=0, cstime=0, priority=0, nice_val=0, num_threads=1;
        uint64_t itrealvalue=0, starttime=0, vsize=0;
        int64_t rss_pages=0;

        iss >> state_char >> ppid >> pgrp >> session >> tty_nr >> tpgid >> flags
            >> minflt >> cminflt >> majflt >> cmajflt >> utime >> stime
            >> cutime >> cstime >> priority >> nice_val >> num_threads
            >> itrealvalue >> starttime >> vsize >> rss_pages;

        out_proc.state = static_cast<ProcessState>(state_char);
        out_proc.ppid = ppid;
        out_proc.utime_ticks = utime;
        out_proc.stime_ticks = stime;
        out_proc.nice_val = static_cast<int32_t>(nice_val);
        out_proc.num_threads = static_cast<uint32_t>(num_threads > 0 ? num_threads : 1);
        out_proc.start_time_ticks = starttime;
        out_proc.vms_bytes = vsize;

        long page_size = sysconf(_SC_PAGESIZE);
        if (page_size <= 0) page_size = 4096;
        out_proc.rss_bytes = static_cast<uint64_t>(rss_pages > 0 ? rss_pages * page_size : 0);

        uint64_t current_ticks = utime + stime;
        auto it = prev_proc_ticks_.find(pid);
        if (it != prev_proc_ticks_.end() && current_ticks >= it->second) {
            uint64_t delta_proc = current_ticks - it->second;
            // CPU approx
            out_proc.cpu_usage_pct = (delta_proc > 0) ? std::min(100.0, static_cast<double>(delta_proc) * 1.5) : 0.0;
        } else {
            out_proc.cpu_usage_pct = 0.0;
        }
        prev_proc_ticks_[pid] = current_ticks;
    }

    // 2. Read /proc/[pid]/cmdline
    std::string cmdline_path = "/proc/" + std::to_string(pid) + "/cmdline";
    std::ifstream cmd_file(cmdline_path, std::ios::binary);
    if (cmd_file.is_open()) {
        std::string cmd;
        char ch;
        while (cmd_file.get(ch)) {
            if (ch == '\0') cmd += ' ';
            else cmd += ch;
        }
        if (!cmd.empty() && cmd.back() == ' ') cmd.pop_back();
        out_proc.cmdline = cmd.empty() ? ("[" + out_proc.comm + "]") : cmd;
    } else {
        out_proc.cmdline = "[" + out_proc.comm + "]";
    }

    // 3. Read /proc/[pid]/status for UID/GID
    std::string status_path = "/proc/" + std::to_string(pid) + "/status";
    std::ifstream status_file(status_path);
    if (status_file.is_open()) {
        std::string sline;
        while (std::getline(status_file, sline)) {
            if (sline.rfind("Uid:", 0) == 0) {
                sscanf(sline.c_str(), "Uid:\t%u", &out_proc.uid);
            } else if (sline.rfind("Gid:", 0) == 0) {
                sscanf(sline.c_str(), "Gid:\t%u", &out_proc.gid);
            }
        }
    }

    // 4. Read /proc/[pid]/cgroup
    std::string cgroup_path = "/proc/" + std::to_string(pid) + "/cgroup";
    std::ifstream cg_file(cgroup_path);
    if (cg_file.is_open()) {
        std::string cgline;
        while (std::getline(cg_file, cgline)) {
            out_proc.cgroup_path = cgline;
            size_t sys_pos = cgline.find(".service");
            if (sys_pos != std::string::npos) {
                size_t slash = cgline.rfind('/', sys_pos);
                if (slash != std::string::npos) {
                    out_proc.systemd_unit = cgline.substr(slash + 1, (sys_pos + 8) - (slash + 1));
                }
            }
        }
    }
    if (out_proc.systemd_unit.empty()) {
        if (out_proc.pid == 1) out_proc.systemd_unit = "init.system";
        else out_proc.systemd_unit = "user.slice";
    }

    return true;
}

bool LinuxTelemetryCollector::sample_all_processes(std::unordered_map<Pid, ProcessRecord>& out_map) {
    out_map.clear();
    raii::UniqueDir dir(opendir("/proc"));
    if (!dir) {
        return false;
    }

    struct dirent* entry = nullptr;
    while ((entry = readdir(dir.get())) != nullptr) {
        if (entry->d_type == DT_DIR || entry->d_type == DT_UNKNOWN) {
            char* endptr = nullptr;
            long val = strtol(entry->d_name, &endptr, 10);
            if (*endptr == '\0' && val > 0) {
                Pid pid = static_cast<Pid>(val);
                ProcessRecord rec;
                if (sample_process(pid, rec)) {
                    out_map[pid] = std::move(rec);
                }
            }
        }
    }

    return true;
}

} // namespace osguardian::telemetry
