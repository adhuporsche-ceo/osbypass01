# OS Guardian - Native Linux Autonomous Remediation Engine
# Makefile for building, testing, and installing Phase 1

CXX ?= g++
CXXFLAGS ?= -std=c++20 -O2 -Wall -Wextra -Wpedantic
INCLUDES = -I native/src

SRCS = native/src/telemetry/collector.cpp \
       native/src/cli/main.cpp

BIN_DIR = bin
TARGET = $(BIN_DIR)/osguardian

PREFIX ?= /usr/local
BINDIR ?= $(PREFIX)/bin

.PHONY: all clean install test package package-deb help

all: $(TARGET)

$(TARGET): $(SRCS)
	@mkdir -p $(BIN_DIR)
	@echo "==> Compiling OS Guardian (C++20)..."
	$(CXX) $(CXXFLAGS) $(INCLUDES) $(SRCS) -o $(TARGET)
	@echo "==> Build complete: $(TARGET)"

install: $(TARGET)
	@echo "==> Installing $(TARGET) to $(DESTDIR)$(BINDIR)..."
	@install -d $(DESTDIR)$(BINDIR)
	@install -m 755 $(TARGET) $(DESTDIR)$(BINDIR)/osguardian
	@echo "==> Installed successfully. Run 'osguardian status'."

test: $(TARGET)
	@echo "==> Running Phase 1 Test Suite..."
	@echo "--- 1. Testing 'osguardian status' output ---"
	@./$(TARGET) status
	@echo ""
	@echo "--- 2. Testing 'osguardian status --json' output ---"
	@./$(TARGET) status --json | grep -q '"status": "ACTIVE"' && echo "[PASS] JSON status contains status=ACTIVE"
	@./$(TARGET) status --json | grep -q '"hostname"' && echo "[PASS] JSON status contains hostname"
	@./$(TARGET) status --json | grep -q '"kernel_version"' && echo "[PASS] JSON status contains kernel_version"
	@./$(TARGET) status --json | grep -q '"uptime_seconds"' && echo "[PASS] JSON status contains uptime_seconds"
	@./$(TARGET) status --json | grep -q '"cpu_count"' && echo "[PASS] JSON status contains cpu_count"
	@./$(TARGET) status --json | grep -q '"process_count"' && echo "[PASS] JSON status contains process_count"
	@echo "==> All Phase 1 tests passed successfully!"

package: $(TARGET)
	@bash scripts/package.sh --zip-only

package-deb: $(TARGET)
	@bash scripts/package.sh --deb-only

clean:
	@rm -rf $(BIN_DIR) packaging/dist packaging/tar
	@echo "==> Cleaned build artifacts."

help:
	@echo "OS Guardian Build System:"
	@echo "  make          - Build native osguardian binary"
	@echo "  make test     - Run verification test suite against real Linux kernel"
	@echo "  make install  - Install to $(BINDIR)"
	@echo "  make package  - Build portable Kali ZIP package"
	@echo "  make package-deb - Build Debian .deb package"
	@echo "  make clean    - Clean build outputs"
