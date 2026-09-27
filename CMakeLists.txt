cmake_minimum_required(VERSION 3.16)
project(osguardian VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Optimization & warnings
add_compile_options(-Wall -Wextra -Wpedantic -O2)

include_directories(native/src)

set(SOURCES
    native/src/telemetry/collector.cpp
    native/src/cli/main.cpp
)

add_executable(osguardian ${SOURCES})

# Target installation paths (standard GNUInstallDirs)
include(GNUInstallDirs)
install(TARGETS osguardian
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
)

enable_testing()
add_test(NAME TestStatus
    COMMAND osguardian status
)
add_test(NAME TestStatusJson
    COMMAND osguardian status --json
)
