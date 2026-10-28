#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# Use the full parser build; omitting this tag would remove the in-process
# AnyDoc capability when replacing the v0.8.3 server.
bash scripts/build-anydoc-lib.sh
source_commit=${SOURCE_COMMIT:-$(git rev-parse HEAD)}
build_time=${BUILD_TIME:-$(date -u +%Y-%m-%dT%H:%M:%SZ)}
go_version=$(go version | awk '{print $3}')
version=0.8.3-helmskb-assistant.1
ldflags="-w -s -X github.com/Tencent/WeKnora/internal/handler.Version=$version -X github.com/Tencent/WeKnora/internal/handler.Edition=standard -X github.com/Tencent/WeKnora/internal/handler.CommitID=$source_commit -X github.com/Tencent/WeKnora/internal/handler.BuildTime=$build_time -X github.com/Tencent/WeKnora/internal/handler.GoVersion=$go_version -X google.golang.org/protobuf/reflect/protoregistry.conflictPolicy=warn"
mkdir -p build/helmskb
CGO_ENABLED=1 CGO_CFLAGS="-Wno-deprecated-declarations" go build -tags anydoc -ldflags "$ldflags" -o build/helmskb/WeKnora ./cmd/server
sha256sum build/helmskb/WeKnora
