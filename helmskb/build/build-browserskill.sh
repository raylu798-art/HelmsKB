#!/usr/bin/env bash
set -euo pipefail
cd /src
toolchain=$(python3 -c 'import json;print(json.load(open("helmskb/build/toolchains.lock.json"))["browserSkillRust"])')
rustup run "$toolchain" rustc --version
export RUSTUP_TOOLCHAIN="$toolchain" CARGO_BUILD_JOBS=2
bash scripts/build_browserskill.sh "${1:-/output/browserskill}" linux/amd64
